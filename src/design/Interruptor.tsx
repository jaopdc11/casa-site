import { cx } from './util'

/**
 * Chave liga/desliga (role="switch"). Para estado binário que vale na hora
 * (horário ativo, "definir brilho"). O alvo de toque tem 44px mesmo com a
 * pílula visível menor.
 */
export function Interruptor({
  ligado,
  aoMudar,
  rotulo,
  desabilitado = false,
  className,
}: {
  ligado: boolean
  aoMudar: (v: boolean) => void
  /** aria-label obrigatório: a chave sozinha não diz o que liga */
  rotulo: string
  desabilitado?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      title={rotulo}
      disabled={desabilitado}
      onClick={() => aoMudar(!ligado)}
      className={cx(
        'inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-card transition-transform duration-150 ease-suave active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <span
        className={cx(
          'relative h-7 w-12 rounded-full border transition-colors duration-200 ease-suave',
          ligado ? 'border-acento bg-acento' : 'border-borda bg-superficie-alta',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-[22px] w-[22px] rounded-full shadow-card transition-[left,background-color] duration-200 ease-suave',
            ligado ? 'left-[calc(100%-24px)] bg-sobre-acento' : 'left-0.5 bg-suave',
          )}
        />
      </span>
    </button>
  )
}
