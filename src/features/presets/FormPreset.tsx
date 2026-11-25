import { useEffect, useState } from 'react'
import { Aviso, Botao, Campo, Rotulo, Sheet, useToast, vibrar } from '@/design'
import { useCasa } from '@/lib/casa'
import type { PresetNovo } from '@/lib/tipos'
import { BrilhoOpcional, SeletorVisual, type ModoVisual } from '@/features/luz/SeletorVisual'
import { criarPreset } from './presets.queries'
import { amostraDoPreset, descreverPreset } from './descricao'

/** Criar preset: nome, branco (temperatura) ou cor, brilho opcional. Prévia ao vivo. */
export function FormPreset({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const toast = useToast()
  const casa = useCasa()
  const [nome, setNome] = useState('')
  const [modo, setModo] = useState<Exclude<ModoVisual, 'manter'>>('branco')
  const [temperatura, setTemperatura] = useState(25)
  const [cor, setCor] = useState('#ff6600')
  const [definirBrilho, setDefinirBrilho] = useState(true)
  const [brilho, setBrilho] = useState(60)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setNome('')
    setModo('branco')
    setTemperatura(25)
    setCor('#ff6600')
    setDefinirBrilho(true)
    setBrilho(60)
    setErro(null)
    setSalvando(false)
  }, [aberto])

  const previa = { cor: modo === 'cor' ? cor : null, temperatura: modo === 'branco' ? temperatura : null, brilho: definirBrilho ? brilho : null }

  async function salvar() {
    const n = nome.trim().replace(/\s+/g, ' ')
    if (!n) return setErro('Dê um nome ao preset.')
    setErro(null)
    setSalvando(true)
    const corpo: PresetNovo = { nome: n }
    if (modo === 'cor') corpo.cor = cor
    else corpo.temperatura = temperatura
    if (definirBrilho) corpo.brilho = brilho
    try {
      const p = await criarPreset(corpo)
      casa.mudarPresets((l) => [...l.filter((x) => x.id !== p.id), p].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
      vibrar('sucesso')
      toast.mostrar('Preset salvo')
      aoFechar()
    } catch (e) {
      vibrar('erro')
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o preset.')
      setSalvando(false)
    }
  }

  return (
    <Sheet
      aberto={aberto}
      aoFechar={aoFechar}
      selo="Presets"
      titulo="Novo preset"
      rodape={
        <>
          <Botao variante="fantasma" className="flex-1" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao className="flex-1" carregando={salvando} onClick={() => void salvar()}>
            Salvar
          </Botao>
        </>
      }
    >
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        <div className="flex items-center gap-4 rounded-card border border-borda bg-campo p-3">
          <span
            className="h-14 w-14 shrink-0 rounded-[12px] ring-1 ring-inset ring-black/10 transition-colors duration-200 ease-suave"
            style={{ backgroundColor: amostraDoPreset(previa) }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-texto">{nome.trim() || 'Sem nome'}</p>
            <p className="truncate text-sm text-suave">{descreverPreset(previa)}</p>
          </div>
        </div>

        <Campo rotulo="Nome" value={nome} maxLength={40} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Leitura noturna" autoComplete="off" />

        <div>
          <Rotulo>Visual</Rotulo>
          <SeletorVisual
            modo={modo}
            aoMudarModo={(m) => setModo(m === 'cor' ? 'cor' : 'branco')}
            temperatura={temperatura}
            aoMudarTemperatura={setTemperatura}
            cor={cor}
            aoMudarCor={setCor}
          />
        </div>

        <BrilhoOpcional
          ativo={definirBrilho}
          aoAtivar={setDefinirBrilho}
          brilho={brilho}
          aoMudar={setBrilho}
          ajuda="Sem isso, o preset mantém o brilho atual."
        />

        {erro && <Aviso className="animate-fade">{erro}</Aviso>}
      </form>
    </Sheet>
  )
}
