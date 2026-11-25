import { Deslizador, Icone, Interruptor, Tabs } from '@/design'
import { TRILHO_TEMPERATURA } from '@/lib/cores'
import { PaletaCores } from './PaletaCores'

export type ModoVisual = 'manter' | 'branco' | 'cor'

/**
 * Escolha de visual em formulário (horário, preset): branco com temperatura ou
 * cor. Com `permitirManter`, ganha a opção de não mexer no visual atual.
 */
export function SeletorVisual({
  modo,
  aoMudarModo,
  temperatura,
  aoMudarTemperatura,
  cor,
  aoMudarCor,
  permitirManter = false,
}: {
  modo: ModoVisual
  aoMudarModo: (m: ModoVisual) => void
  temperatura: number
  aoMudarTemperatura: (t: number) => void
  cor: string
  aoMudarCor: (hex: string) => void
  permitirManter?: boolean
}) {
  const abas = [
    ...(permitirManter ? [{ id: 'manter' as const, rotulo: 'Manter' }] : []),
    { id: 'branco' as const, rotulo: <><Icone n="sun" className="h-4 w-4" />Branco</> },
    { id: 'cor' as const, rotulo: <><Icone n="palette" className="h-4 w-4" />Cor</> },
  ]
  return (
    <div className="space-y-4">
      <Tabs<ModoVisual> cheio tom="neutro" ativa={modo} aoTrocar={aoMudarModo} abas={abas} />
      {modo === 'manter' && <p className="text-xs text-tenue">A luz acende com o último visual usado.</p>}
      {modo === 'branco' && (
        <div className="animate-fade">
          <Deslizador
            rotulo="Temperatura do branco"
            valor={temperatura}
            trilho={TRILHO_TEMPERATURA}
            debounceMs={0}
            aoMover={aoMudarTemperatura}
            aoSoltar={aoMudarTemperatura}
          />
          <div className="mt-0.5 flex justify-between text-xs text-tenue">
            <span>Quente</span>
            <span>Neutro</span>
            <span>Frio</span>
          </div>
        </div>
      )}
      {modo === 'cor' && (
        <div className="animate-fade">
          <PaletaCores valor={cor} aoEscolher={aoMudarCor} aoPrevisualizar={aoMudarCor} />
        </div>
      )}
    </div>
  )
}

/** Brilho opcional: chave "definir brilho" e, ligada, o deslizador. */
export function BrilhoOpcional({
  ativo,
  aoAtivar,
  brilho,
  aoMudar,
  ajuda = 'Sem isso, mantém o brilho atual.',
}: {
  ativo: boolean
  aoAtivar: (v: boolean) => void
  brilho: number
  aoMudar: (v: number) => void
  ajuda?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-texto">Definir brilho</p>
          <p className="text-xs text-tenue">{ativo ? <span className="font-mono">{brilho}%</span> : ajuda}</p>
        </div>
        <Interruptor ligado={ativo} aoMudar={aoAtivar} rotulo="Definir brilho" />
      </div>
      {ativo && (
        <div className="animate-fade">
          <Deslizador rotulo="Brilho" min={1} max={100} valor={brilho} debounceMs={0} aoMover={aoMudar} aoSoltar={aoMudar} />
        </div>
      )}
    </div>
  )
}
