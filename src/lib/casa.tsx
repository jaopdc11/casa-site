// Estado compartilhado da casa: aparelhos, presets, horários e histórico.
//
// Uma fonte só, porque as telas se cruzam (Início usa presets, Presets aplica
// na luz, Horários precisa do aparelho). Quem mantém fresco:
// - SSE (lib/eventos.ts): 'estado' entra direto; 'horarios'/'presets'/'eventos'
//   releem a lista correspondente;
// - foco: voltar para o app relê tudo (o celular derruba o SSE em segundo plano).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { listarAparelhos } from '@/features/luz/luz.queries'
import { listarPresets } from '@/features/presets/presets.queries'
import { listarHorarios } from '@/features/horarios/horarios.queries'
import { listarEventos } from '@/features/historico/historico.queries'
import { comAtraso, ouvirCasa, reabrirSeFechado } from './eventos'
import type { Aparelho, Estado, EventoLog, Horario, Preset } from './tipos'

export type Recurso<T> = {
  dados: T | null
  erro: string | null
  carregando: boolean
}

type Nome = 'aparelhos' | 'presets' | 'horarios' | 'eventos'

type Ctx = {
  aparelhos: Recurso<Aparelho[]>
  presets: Recurso<Preset[]>
  horarios: Recurso<Horario[]>
  eventos: Recurso<EventoLog[]>
  recarregar: (n: Nome) => Promise<void>
  recarregarTudo: () => void
  /** troca o estado de um aparelho na hora (SSE, UI otimista, rollback) */
  aplicarEstado: (aparelhoId: string, estado: Estado | null) => void
  /** mexe na lista de horários sem ir à rede (UI otimista) */
  mudarHorarios: (fn: (l: Horario[]) => Horario[]) => void
  mudarPresets: (fn: (l: Preset[]) => Preset[]) => void
}

const ContextoCasa = createContext<Ctx | null>(null)

export function useCasa(): Ctx {
  const c = useContext(ContextoCasa)
  if (!c) throw new Error('useCasa fora do ProvedorCasa')
  return c
}

const VAZIO = { dados: null, erro: null, carregando: true }

function useRecurso<T>(buscar: () => Promise<T>) {
  const [r, setR] = useState<Recurso<T>>(VAZIO)
  // resposta velha que chega depois de uma nova é descartada
  const seq = useRef(0)
  const carregar = useCallback(async () => {
    const n = ++seq.current
    setR((a) => ({ ...a, carregando: a.dados === null }))
    try {
      const dados = await buscar()
      if (n === seq.current) setR({ dados, erro: null, carregando: false })
    } catch (e) {
      if (n === seq.current)
        setR((a) => ({ ...a, erro: e instanceof Error ? e.message : 'Falha ao carregar.', carregando: false }))
    }
  }, [buscar])
  const mudar = useCallback((fn: (d: T) => T) => setR((a) => (a.dados === null ? a : { ...a, dados: fn(a.dados) })), [])
  return [r, carregar, mudar] as const
}

export function ProvedorCasa({ children }: { children: ReactNode }) {
  const [aparelhos, carregarAparelhos, mudarAparelhos] = useRecurso(listarAparelhos)
  const [presets, carregarPresets, mudarPresets] = useRecurso(listarPresets)
  const [horarios, carregarHorarios, mudarHorarios] = useRecurso(listarHorarios)
  const [eventos, carregarEventos] = useRecurso(useCallback(() => listarEventos(), []))

  const recarregar = useCallback(
    (n: Nome) => ({ aparelhos: carregarAparelhos, presets: carregarPresets, horarios: carregarHorarios, eventos: carregarEventos })[n](),
    [carregarAparelhos, carregarPresets, carregarHorarios, carregarEventos],
  )

  const recarregarTudo = useCallback(() => {
    void carregarAparelhos()
    void carregarPresets()
    void carregarHorarios()
    void carregarEventos()
  }, [carregarAparelhos, carregarPresets, carregarHorarios, carregarEventos])

  const aplicarEstado = useCallback(
    (id: string, estado: Estado | null) => mudarAparelhos((l) => l.map((a) => (a.id === id ? { ...a, estado } : a))),
    [mudarAparelhos],
  )

  useEffect(() => {
    recarregarTudo()
  }, [recarregarTudo])

  // Tempo real. Rajadas (o agendador dispara e gera horário + evento + estado)
  // viram uma releitura só por lista.
  useEffect(() => {
    const atrasos = {
      horarios: comAtraso(() => void carregarHorarios()),
      presets: comAtraso(() => void carregarPresets()),
      eventos: comAtraso(() => void carregarEventos()),
    }
    const parar = ouvirCasa((e) => {
      if (e.tipo === 'estado') aplicarEstado(e.aparelho_id, e.estado)
      else atrasos[e.tipo].chamar()
    })
    return () => {
      parar()
      Object.values(atrasos).forEach((a) => a.cancelar())
    }
  }, [aplicarEstado, carregarHorarios, carregarPresets, carregarEventos])

  // Voltou para o app (troca de aba, desbloqueou o celular): relê tudo.
  useEffect(() => {
    const atraso = comAtraso(() => {
      reabrirSeFechado()
      recarregarTudo()
    }, 150)
    const visivel = () => {
      if (document.visibilityState === 'visible') atraso.chamar()
    }
    document.addEventListener('visibilitychange', visivel)
    window.addEventListener('focus', atraso.chamar)
    return () => {
      document.removeEventListener('visibilitychange', visivel)
      window.removeEventListener('focus', atraso.chamar)
      atraso.cancelar()
    }
  }, [recarregarTudo])

  const valor = useMemo<Ctx>(
    () => ({ aparelhos, presets, horarios, eventos, recarregar, recarregarTudo, aplicarEstado, mudarHorarios, mudarPresets }),
    [aparelhos, presets, horarios, eventos, recarregar, recarregarTudo, aplicarEstado, mudarHorarios, mudarPresets],
  )

  return <ContextoCasa.Provider value={valor}>{children}</ContextoCasa.Provider>
}
