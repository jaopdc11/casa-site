import { Icone, cx } from '@/design'
import { ABAS, type Vista } from './navegacao'

type Props = { vista: Vista; aoIr: (v: Vista) => void }

/**
 * Barra inferior fixa (só celular), cinco abas. A aba ativa ganha uma pílula
 * atrás do ícone, como nos apps nativos. Safe-area de baixo vai AQUI
 * (elemento fixo), não no body.
 */
export function NavInferior({ vista, aoIr }: Props) {
  return (
    <nav
      aria-label="Navegação"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-campo/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch px-1">
        {ABAS.map((i) => {
          const on = vista === i.id
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => aoIr(i.id)}
              aria-current={on ? 'page' : undefined}
              className={cx(
                'flex h-nav flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-[0.94]',
                on ? 'text-acento' : 'text-tenue hover:text-suave',
              )}
            >
              <span
                className={cx(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200 ease-suave',
                  on && 'bg-tinta-acento',
                )}
              >
                <Icone n={i.icone} className="h-[21px] w-[21px]" />
              </span>
              {i.rotulo}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
