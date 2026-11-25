import { useMemo, useState } from 'react'
import { Aviso, Botao, BotaoIcone, CabecalhoTela, Cartao, Esqueleto, Icone, Sheet, Vazio, useToast, vibrar } from '@/design'
import { useCasa } from '@/lib/casa'
import type { Preset } from '@/lib/tipos'
import { raizes } from '@/features/luz/luz.queries'
import { useComandoLuz } from '@/features/luz/useComandoLuz'
import { FormPreset } from './FormPreset'
import { amostraDoPreset, descreverPreset } from './descricao'
import { excluirPreset } from './presets.queries'

/** Presets: visuais salvos com nome. Aplicar manda para a luz; criar só salva. */
export function Presets() {
  const casa = useCasa()
  const toast = useToast()
  const { aplicarPreset } = useComandoLuz()
  const { presets, aparelhos } = casa
  const [criando, setCriando] = useState(false)
  const [excluindo, setExcluindo] = useState<Preset | null>(null)
  const [ocupadoExclusao, setOcupadoExclusao] = useState(false)
  const [aplicando, setAplicando] = useState<number | null>(null)

  const alvo = useMemo(() => (aparelhos.dados ? (raizes(aparelhos.dados)[0] ?? null) : null), [aparelhos.dados])

  async function aplicar(p: Preset) {
    if (!alvo) return
    setAplicando(p.id)
    await aplicarPreset(alvo, p, `${p.nome} aplicado`)
    setAplicando(null)
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    setOcupadoExclusao(true)
    try {
      await excluirPreset(excluindo.id)
      casa.mudarPresets((l) => l.filter((x) => x.id !== excluindo.id))
      vibrar('aviso')
      toast.mostrar('Preset excluído')
      setExcluindo(null)
    } catch (e) {
      toast.mostrar(e instanceof Error ? e.message : 'Não foi possível excluir o preset.', { tom: 'erro' })
    } finally {
      setOcupadoExclusao(false)
    }
  }

  return (
    <div>
      <CabecalhoTela
        titulo="Presets"
        descricao={alvo ? `Visuais salvos, aplicados em ${alvo.nome.toLowerCase()}.` : 'Visuais salvos para aplicar com um toque.'}
        acao={
          <Botao tamanho="sm" icone={<Icone n="plus" />} onClick={() => setCriando(true)}>
            Novo
          </Botao>
        }
      />

      {presets.erro && (
        <Aviso className="mb-4" aoTentarDeNovo={() => void casa.recarregar('presets')}>
          {presets.erro}
        </Aviso>
      )}

      {presets.carregando && !presets.dados ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Cartao key={i} semPadding className="overflow-hidden">
              <Esqueleto className="h-24 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Esqueleto className="h-4 w-3/4" />
                <Esqueleto className="h-3 w-1/2" />
                <Esqueleto className="mt-3 h-9 w-full rounded-card" />
              </div>
            </Cartao>
          ))}
        </div>
      ) : presets.dados && presets.dados.length === 0 ? (
        <Vazio
          icone="palette"
          titulo="Nenhum preset salvo."
          descricao="Salve combinações de cor e brilho para usar com um toque, aqui ou no Início."
          acao={
            <Botao icone={<Icone n="plus" />} onClick={() => setCriando(true)}>
              Criar preset
            </Botao>
          }
        />
      ) : presets.dados ? (
        <div className="cascata grid grid-cols-2 gap-3 lg:grid-cols-3">
          {presets.dados.map((p) => (
            <Cartao key={p.id} semPadding className="flex flex-col overflow-hidden">
              <div className="h-24 border-b border-borda" style={{ backgroundColor: amostraDoPreset(p) }} aria-hidden />
              <div className="flex flex-1 flex-col p-3.5">
                <p className="truncate font-display text-sm font-semibold text-texto">{p.nome}</p>
                <p className="mt-0.5 truncate text-xs text-tenue">{descreverPreset(p)}</p>
                <div className="mt-3 flex items-center gap-1">
                  <Botao
                    tamanho="sm"
                    variante="secundario"
                    className="flex-1"
                    carregando={aplicando === p.id}
                    disabled={!alvo}
                    onClick={() => void aplicar(p)}
                  >
                    Aplicar
                  </Botao>
                  <BotaoIcone rotulo={`Excluir ${p.nome}`} onClick={() => setExcluindo(p)} className="-mr-1.5">
                    <Icone n="trash" className="h-[18px] w-[18px]" />
                  </BotaoIcone>
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      ) : null}

      <FormPreset aberto={criando} aoFechar={() => setCriando(false)} />

      <Sheet
        aberto={!!excluindo}
        aoFechar={() => setExcluindo(null)}
        selo="Presets"
        titulo="Excluir preset?"
        largura="sm"
        rodape={
          <>
            <Botao variante="fantasma" className="flex-1" onClick={() => setExcluindo(null)}>
              Manter
            </Botao>
            <Botao variante="perigo" className="flex-1" carregando={ocupadoExclusao} onClick={() => void confirmarExclusao()}>
              Excluir
            </Botao>
          </>
        }
      >
        {excluindo && (
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 shrink-0 rounded-[10px] ring-1 ring-inset ring-black/10" style={{ backgroundColor: amostraDoPreset(excluindo) }} />
            <p className="text-sm text-suave">
              <span className="font-medium text-texto">{excluindo.nome}</span> deixará de aparecer aqui e no Início. Esta ação não pode ser desfeita.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  )
}
