import { Icone } from '@/design'
import { IndicadorConexao } from './IndicadorConexao'

/**
 * Topo sticky do celular: marca à esquerda, conexão ao vivo à direita.
 * Safe-area de cima mora aqui. No desktop some (sidebar).
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-borda bg-fundo/85 pt-[env(safe-area-inset-top)] backdrop-blur-lg lg:hidden">
      <div className="flex h-topo items-center gap-2.5 px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-tinta-acento text-acento">
          <Icone n="lampada" className="h-[18px] w-[18px]" />
        </span>
        <span className="flex-1 font-display text-base font-semibold text-texto">Casa</span>
        <IndicadorConexao />
      </div>
    </header>
  )
}
