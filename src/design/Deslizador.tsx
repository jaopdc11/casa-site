import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { cx } from './util'

export type PropsDeslizador = {
  valor: number
  min?: number
  max?: number
  passo?: number
  /** chamado ao SOLTAR (dedo, mouse ou teclado com folga de debounce) — é aqui que vai pra rede */
  aoSoltar: (v: number) => void
  /** chamado a cada movimento, para mostrar o número ao vivo */
  aoMover?: (v: number) => void
  rotulo: string
  /**
   * Trilho: 'preenchido' (acento até o polegar, para brilho) ou um CSS
   * background pronto (quente→frio da temperatura).
   */
  trilho?: 'preenchido' | string
  desabilitado?: boolean
  /** espera depois do último movimento de teclado antes de enviar */
  debounceMs?: number
  className?: string
}

/**
 * Deslizador que só envia ao soltar. Enquanto o dedo arrasta, o valor é local
 * (nada de 40 comandos por segundo na lâmpada); um valor novo vindo de fora
 * (SSE, rollback) só entra quando ninguém está arrastando.
 */
export function Deslizador({
  valor,
  min = 0,
  max = 100,
  passo = 1,
  aoSoltar,
  aoMover,
  rotulo,
  trilho = 'preenchido',
  desabilitado = false,
  debounceMs = 350,
  className,
}: PropsDeslizador) {
  const [local, setLocal] = useState(valor)
  const arrastando = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const ultimoEnviado = useRef(valor)

  useEffect(() => {
    if (!arrastando.current) {
      setLocal(valor)
      ultimoEnviado.current = valor
    }
  }, [valor])

  useEffect(() => () => clearTimeout(timer.current), [])

  function enviar(v: number) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      arrastando.current = false
      if (v !== ultimoEnviado.current) {
        ultimoEnviado.current = v
        aoSoltar(v)
      }
    }, debounceMs)
  }

  const pct = ((local - min) / (max - min)) * 100
  const fundo =
    trilho === 'preenchido'
      ? `linear-gradient(to right, rgb(var(--acento)) 0%, rgb(var(--acento)) ${pct}%, rgb(var(--superficie-alta)) ${pct}%, rgb(var(--superficie-alta)) 100%)`
      : trilho

  return (
    <input
      type="range"
      aria-label={rotulo}
      min={min}
      max={max}
      step={passo}
      value={local}
      disabled={desabilitado}
      onPointerDown={() => {
        arrastando.current = true
        clearTimeout(timer.current)
      }}
      onChange={(e) => {
        const v = Number(e.target.value)
        arrastando.current = true
        setLocal(v)
        aoMover?.(v)
      }}
      onPointerUp={(e) => enviar(Number((e.target as HTMLInputElement).value))}
      onPointerCancel={(e) => enviar(Number((e.target as HTMLInputElement).value))}
      onTouchEnd={(e) => enviar(Number((e.target as HTMLInputElement).value))}
      onKeyUp={(e) => enviar(Number((e.target as HTMLInputElement).value))}
      onBlur={(e) => {
        if (arrastando.current) enviar(Number(e.target.value))
      }}
      className={cx('deslizador', className)}
      style={{ '--trilho': fundo } as CSSProperties}
    />
  )
}
