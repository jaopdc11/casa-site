import { Avatar, Icone, Selo, cx, type NomeIcone } from '@/design'
import type { Usuario } from '@/lib/api'
import { IndicadorConexao } from './IndicadorConexao'
import { ABAS, type Vista } from './navegacao'

type Props = {
  usuario: Usuario
  vista: Vista
  aoIr: (v: Vista) => void
  aoSair: () => void
}

/** Sidebar do desktop (lg+): substitui top bar + nav inferior. */
export function Sidebar(p: Props) {
  const nome = p.usuario.nome || p.usuario.email
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-sidebar flex-col border-r border-borda bg-campo lg:flex">
      <div className="mx-3 mt-4 flex items-center gap-3 rounded-card border border-borda bg-superficie px-3 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-tinta-acento text-acento">
          <Icone n="lampada" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <Selo className="mb-1">Automação</Selo>
          <span className="block truncate font-display text-sm font-semibold text-texto">Casa</span>
        </span>
      </div>

      <div className="px-6 pt-3">
        <IndicadorConexao />
      </div>

      <nav className="rolagem-fina flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação">
        <ul className="space-y-0.5">
          {ABAS.map((i) => (
            <Item key={i.id} icone={i.icone} rotulo={i.rotulo} ativo={p.vista === i.id} aoTocar={() => p.aoIr(i.id)} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-borda px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar nome={nome} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-texto">{p.usuario.nome || 'Conta'}</span>
            <span className="block truncate text-xs text-tenue">{p.usuario.email}</span>
          </span>
        </div>
        <ul className="mt-1 space-y-0.5">
          <Item icone="logOut" rotulo="Sair" aoTocar={p.aoSair} />
        </ul>
      </div>
    </aside>
  )
}

function Item({ icone, rotulo, ativo = false, aoTocar }: { icone: NomeIcone; rotulo: string; ativo?: boolean; aoTocar: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={aoTocar}
        aria-current={ativo ? 'page' : undefined}
        className={cx(
          'flex min-h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm transition-colors',
          ativo ? 'bg-tinta-acento font-medium text-acento' : 'text-suave hover:bg-superficie-alta hover:text-texto',
        )}
      >
        <Icone n={icone} className="h-[18px] w-[18px]" />
        {rotulo}
      </button>
    </li>
  )
}
