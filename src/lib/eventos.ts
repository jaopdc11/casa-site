// Tempo real: a API avisa por SSE (GET /ao-vivo) e quem estiver na tela relê.
//
// Um EventSource só, compartilhado entre quem ouve; fecha quando o último sai.
// Ele reconecta sozinho. O celular derruba a conexão em segundo plano, e aí
// quem cobre é a releitura ao ganhar foco (ver lib/casa.tsx) — evento perdido
// enquanto estava fechado não importa.

import { API_URL } from './api'
import type { Estado } from './tipos'

export type EventoAoVivo =
  | { tipo: 'estado'; aparelho_id: string; estado: Estado }
  | { tipo: 'horarios' }
  | { tipo: 'presets' }
  | { tipo: 'eventos' }

export type Conexao = 'conectando' | 'ao-vivo' | 'reconectando'

type Ouvinte = (e: EventoAoVivo) => void
type OuvinteConexao = (c: Conexao) => void

const ouvintes = new Set<Ouvinte>()
const ouvintesConexao = new Set<OuvinteConexao>()
let fonte: EventSource | null = null
let conexao: Conexao = 'conectando'

function mudarConexao(c: Conexao) {
  conexao = c
  ouvintesConexao.forEach((o) => o(c))
}

function abrir() {
  const f = new EventSource(`${API_URL}/ao-vivo`, { withCredentials: true }) // manda o cookie
  f.onopen = () => mudarConexao('ao-vivo')
  f.onerror = () => mudarConexao('reconectando')
  f.addEventListener('estado', (e) => {
    try {
      const d = JSON.parse((e as MessageEvent).data) as { aparelho_id: string; estado: Estado }
      ouvintes.forEach((o) => o({ tipo: 'estado', aparelho_id: d.aparelho_id, estado: d.estado }))
    } catch {
      /* evento malformado: a próxima releitura corrige */
    }
  })
  for (const tipo of ['horarios', 'presets', 'eventos'] as const) {
    f.addEventListener(tipo, () => ouvintes.forEach((o) => o({ tipo })))
  }
  fonte = f
}

export function ouvirCasa(fn: Ouvinte): () => void {
  if (typeof EventSource === 'undefined') return () => {}
  if (!fonte) abrir()
  ouvintes.add(fn)
  return () => {
    ouvintes.delete(fn)
    if (ouvintes.size === 0 && fonte) {
      fonte.close()
      fonte = null
      mudarConexao('conectando')
    }
  }
}

/** Estado da conexão ao vivo (para o indicador do topo). */
export function ouvirConexao(fn: OuvinteConexao): () => void {
  ouvintesConexao.add(fn)
  fn(conexao)
  return () => ouvintesConexao.delete(fn)
}

/** EventSource que desistiu (servidor fechou com erro) não volta sozinho: reabre. */
export function reabrirSeFechado(): void {
  if (fonte && fonte.readyState === EventSource.CLOSED && ouvintes.size > 0) {
    fonte.close()
    abrir()
  }
}

/** Junta rajadas (vários eventos seguidos) numa releitura só. */
export function comAtraso(fn: () => void, ms = 300): { chamar: () => void; cancelar: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined
  return {
    chamar: () => {
      clearTimeout(timer)
      timer = setTimeout(fn, ms)
    },
    cancelar: () => clearTimeout(timer),
  }
}
