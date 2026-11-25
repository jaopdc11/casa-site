import { useCallback, useRef } from 'react'
import { useToast, vibrar } from '@/design'
import { ErroApi } from '@/lib/api'
import { useCasa } from '@/lib/casa'
import { preverEstado } from '@/lib/cores'
import type { Aparelho, Comando, Preset, RespostaComando } from '@/lib/tipos'
import { comandar as comandarApi } from './luz.queries'
import { aplicarPreset as aplicarPresetApi } from '@/features/presets/presets.queries'

/**
 * Comando com UI otimista: a tela muda na hora, a resposta da API confirma
 * (ou corrige) e, se a lâmpada não responder, volta ao estado anterior com um
 * aviso. Um contador por aparelho garante que uma resposta velha não desfaça
 * um comando mais novo.
 */
export function useComandoLuz() {
  const casa = useCasa()
  const toast = useToast()
  const seqs = useRef(new Map<string, number>())

  const executar = useCallback(
    async (ap: Aparelho, previsto: Comando, chamada: () => Promise<RespostaComando>, aoConcluir?: string): Promise<boolean> => {
      const n = (seqs.current.get(ap.id) ?? 0) + 1
      seqs.current.set(ap.id, n)
      const anterior = ap.estado
      casa.aplicarEstado(ap.id, preverEstado(anterior, previsto))
      try {
        const r = await chamada()
        if (seqs.current.get(ap.id) === n && r.estado) casa.aplicarEstado(ap.id, r.estado)
        if (Object.keys(r.falhas ?? {}).length > 0) toast.mostrar('Parte das lâmpadas não respondeu.', { tom: 'info' })
        else if (aoConcluir) toast.mostrar(aoConcluir)
        return true
      } catch (e) {
        if (seqs.current.get(ap.id) === n) casa.aplicarEstado(ap.id, anterior)
        vibrar('erro')
        const texto =
          e instanceof ErroApi && e.status === 502 ? 'A luz não respondeu' : e instanceof Error ? e.message : 'Não foi possível enviar o comando.'
        toast.mostrar(texto, { tom: 'erro' })
        return false
      }
    },
    [casa, toast],
  )

  const comandar = useCallback(
    (ap: Aparelho, c: Comando) => {
      vibrar('leve')
      return executar(ap, c, () => comandarApi(ap.id, c))
    },
    [executar],
  )

  const aplicarPreset = useCallback(
    (ap: Aparelho, p: Preset, aoConcluir?: string) => {
      vibrar('leve')
      const previsto: Comando = { ligado: true }
      if (p.cor) previsto.cor = p.cor
      else if (p.temperatura !== null) previsto.temperatura = p.temperatura
      if (p.brilho) previsto.brilho = p.brilho
      return executar(ap, previsto, () => aplicarPresetApi(p.id, ap.id), aoConcluir)
    },
    [executar],
  )

  return { comandar, aplicarPreset }
}
