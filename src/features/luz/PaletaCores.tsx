import { useEffect, useRef } from 'react'
import { Icone, cx } from '@/design'
import { PALETA, corParecida } from '@/lib/cores'

/**
 * Amostras das cores com nome (as mesmas que o Argos entende) e, no fim, o
 * seletor nativo para qualquer hex. O nativo só confirma ao fechar o seletor
 * (evento 'change'): arrastar dentro dele não vira rajada de comandos.
 */
export function PaletaCores({
  valor,
  aoEscolher,
  aoPrevisualizar,
  desabilitado = false,
}: {
  valor: string | null
  aoEscolher: (hex: string) => void
  /** enquanto mexe no seletor nativo (para prévia ao vivo em formulário) */
  aoPrevisualizar?: (hex: string) => void
  desabilitado?: boolean
}) {
  const nativo = useRef<HTMLInputElement>(null)
  const escolher = useRef(aoEscolher)
  escolher.current = aoEscolher

  useEffect(() => {
    const el = nativo.current
    if (!el) return
    const mudou = () => escolher.current(el.value.toLowerCase())
    el.addEventListener('change', mudou)
    return () => el.removeEventListener('change', mudou)
  }, [])

  // Não controlado de propósito: o React restauraria o valor antigo a cada
  // 'input' e o 'change' do fechamento leria a cor errada. Sincroniza à mão.
  const hexValido = valor && /^#[0-9a-f]{6}$/i.test(valor) ? valor : '#ff6600'
  useEffect(() => {
    if (nativo.current && document.activeElement !== nativo.current) nativo.current.value = hexValido
  }, [hexValido])

  const daPaleta = PALETA.some((c) => corParecida(c.hex, valor))
  const personalizada = !!valor && !daPaleta

  return (
    <div className="grid grid-cols-5 gap-3 sm:grid-cols-10" role="radiogroup" aria-label="Cor">
      {PALETA.map((c) => {
        const on = corParecida(c.hex, valor)
        return (
          <button
            key={c.nome}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.rotulo}
            title={c.rotulo}
            disabled={desabilitado}
            onClick={() => aoEscolher(c.hex)}
            className={cx(
              'relative mx-auto flex aspect-square w-full max-w-[3rem] items-center justify-center rounded-full transition-transform duration-150 ease-suave active:scale-[0.9] disabled:opacity-50',
              on ? 'ring-2 ring-texto ring-offset-2 ring-offset-superficie' : 'ring-1 ring-inset ring-black/10',
            )}
            style={{ backgroundColor: c.hex }}
          >
            {on && <Icone n="check" className="h-4 w-4 animate-pop text-black/70" />}
          </button>
        )
      })}
      <label
        title="Outra cor"
        className={cx(
          'relative mx-auto flex aspect-square w-full max-w-[3rem] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed transition-transform duration-150 ease-suave active:scale-[0.9]',
          personalizada ? 'border-transparent ring-2 ring-texto ring-offset-2 ring-offset-superficie' : 'border-borda-forte bg-superficie-alta text-suave',
          desabilitado && 'pointer-events-none opacity-50',
        )}
        style={personalizada ? { backgroundColor: valor! } : undefined}
      >
        <input
          ref={nativo}
          type="color"
          aria-label="Escolher outra cor"
          defaultValue={hexValido}
          onChange={(e) => aoPrevisualizar?.(e.target.value.toLowerCase())}
          disabled={desabilitado}
          className="amostra-nativa absolute inset-0 h-full w-full opacity-0"
        />
        {!personalizada && <Icone n="plus" className="h-4 w-4" />}
      </label>
    </div>
  )
}
