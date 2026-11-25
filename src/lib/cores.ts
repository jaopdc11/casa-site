// Cor da luz: paleta, aproximação do branco e textos humanos de comando/estado.
// As cores aqui são DADO (a cor que a lâmpada mostra), não tema: por isso podem
// ser hex literais, ao contrário das cores de interface (ver DESIGN.md).

import type { Comando, Estado } from './tipos'

/** Mesmos nomes e hex de casa/app/comando.py (CORES). */
export const PALETA = [
  { nome: 'vermelho', rotulo: 'Vermelho', hex: '#ff0000' },
  { nome: 'laranja', rotulo: 'Laranja', hex: '#ff6600' },
  { nome: 'amarelo', rotulo: 'Amarelo', hex: '#ffcc00' },
  { nome: 'verde', rotulo: 'Verde', hex: '#00ff00' },
  { nome: 'ciano', rotulo: 'Ciano', hex: '#00ffff' },
  { nome: 'azul', rotulo: 'Azul', hex: '#0000ff' },
  { nome: 'roxo', rotulo: 'Roxo', hex: '#8000ff' },
  { nome: 'rosa', rotulo: 'Rosa', hex: '#ff0080' },
  { nome: 'lilas', rotulo: 'Lilás', hex: '#b266ff' },
] as const

const QUENTE: Rgb = [0xff, 0xb4, 0x6b]
const FRIO: Rgb = [0xc9, 0xe2, 0xff]

/** Trilho do deslizador de temperatura: quente à esquerda, frio à direita. */
export const TRILHO_TEMPERATURA = 'linear-gradient(to right, #ffb46b 0%, #ffe2c2 45%, #f4f1ff 60%, #c9e2ff 100%)'

type Rgb = [number, number, number]

export function hexParaRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1]!, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbParaHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

/** Aproximação do branco na tela: 0 = #ffb46b (quente) … 100 = #c9e2ff (frio). */
export function corDoBranco(temperatura: number | null | undefined): string {
  const t = Math.max(0, Math.min(100, temperatura ?? 50)) / 100
  return rgbParaHex([0, 1, 2].map((i) => QUENTE[i]! + (FRIO[i]! - QUENTE[i]!) * t) as Rgb)
}

/** Duas cores "iguais" para a lâmpada (a ida e volta pela Tuya arredonda o hex). */
export function corParecida(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const x = hexParaRgb(a)
  const y = hexParaRgb(b)
  if (!x || !y) return false
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 24
}

export function nomeDaCor(hex: string): string {
  const p = PALETA.find((c) => corParecida(c.hex, hex))
  return p ? p.rotulo.toLowerCase() : hex
}

export function nomeDaTemperatura(t: number): string {
  if (t <= 25) return 'branco quente'
  if (t >= 75) return 'branco frio'
  return 'branco neutro'
}

/** A cor que a luz está mostrando (para amostra), ou null se apagada/desconhecida. */
export function corVisivel(e: Estado | null | undefined): string | null {
  if (!e || !e.ligado || e.online === false) return null
  if (e.modo === 'colour' && e.cor) return e.cor
  return corDoBranco(e.temperatura)
}

/** Cor de um visual (preset ou ação de horário) para amostra. */
export function corDoVisual(v: { cor?: string | null; temperatura?: number | null }): string | null {
  if (v.cor) return v.cor
  if (v.temperatura !== null && v.temperatura !== undefined) return corDoBranco(v.temperatura)
  return null
}

function maiuscula(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s
}

/**
 * Comando em português. `tempo` = 'infinitivo' para o que vai acontecer
 * ("Acender em branco quente, 60%") e 'passado' para o histórico ("Acendeu…").
 */
export function descreverComando(c: Comando, tempo: 'infinitivo' | 'passado' = 'infinitivo'): string {
  const v = tempo === 'passado' ? { apagar: 'apagou', acender: 'acendeu' } : { apagar: 'apagar', acender: 'acender' }
  if (c.ligado === false) return maiuscula(v.apagar)
  const brilho = c.brilho ? `, ${c.brilho}%` : ''
  if (c.cor) return maiuscula(`${v.acender} em ${nomeDaCor(c.cor)}${brilho}`)
  if (c.temperatura !== undefined && c.temperatura !== null) return maiuscula(`${v.acender} em ${nomeDaTemperatura(c.temperatura)}${brilho}`)
  if (c.brilho) return tempo === 'passado' ? `Brilho ajustado para ${c.brilho}%` : `Ajustar brilho para ${c.brilho}%`
  return maiuscula(v.acender)
}

/** Linha de status do cartão: "Acesa · branco quente · 60%". */
export function descreverEstado(e: Estado | null | undefined): string {
  if (!e) return 'Aguardando a primeira leitura'
  if (e.online === false) return 'Sem conexão com a lâmpada'
  if (e.ligado === null) return 'Estado desconhecido'
  if (!e.ligado) return 'Apagada'
  const visual =
    e.modo === 'colour' && e.cor ? nomeDaCor(e.cor) : e.temperatura !== null ? nomeDaTemperatura(e.temperatura) : null
  return ['Acesa', visual, e.brilho ? `${e.brilho}%` : null].filter(Boolean).join(' · ')
}

/** Estado esperado depois do comando (espelho de aplicar_no_estado da API) — base da UI otimista. */
export function preverEstado(e: Estado | null, c: Comando): Estado {
  const novo: Estado = { ligado: null, modo: null, brilho: null, temperatura: null, cor: null, online: null, ...(e ?? {}) }
  if (c.ligado === false) return { ...novo, ligado: false }
  novo.ligado = true
  if (c.cor) {
    novo.modo = 'colour'
    novo.cor = c.cor
  } else if (c.temperatura !== undefined) {
    novo.modo = 'white'
    novo.temperatura = c.temperatura
  }
  if (c.brilho) novo.brilho = c.brilho
  novo.online = true
  return novo
}
