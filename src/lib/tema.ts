// Tema claro/escuro por CLASSE (.dark no <html>), para a escolha do usuário mandar.
// O ESCURO é o padrão (identidade do app); "sistema" segue o aparelho e muda
// junto com ele. O script inline do index.html aplica a mesma regra antes do
// render para não piscar.

const CHAVE = 'casa:tema'
export type PreferenciaTema = 'sistema' | 'claro' | 'escuro'
export type Tema = 'claro' | 'escuro'

// mesmas cores do --fundo de cada tema (barra de status do celular combina)
const COR_BARRA: Record<Tema, string> = { escuro: '#060910', claro: '#f4f6f9' }

const consulta = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null

export function preferenciaTema(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CHAVE)
    if (v === 'claro' || v === 'sistema' || v === 'escuro') return v
  } catch {
    /* storage bloqueado: fica no padrão */
  }
  return 'escuro'
}

export function temaEfetivo(p: PreferenciaTema = preferenciaTema()): Tema {
  if (p === 'sistema') return consulta()?.matches ? 'claro' : 'escuro'
  return p
}

export function aplicarTema(t: Tema): void {
  document.documentElement.classList.toggle('dark', t === 'escuro')
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', COR_BARRA[t]))
}

export function definirTema(p: PreferenciaTema): Tema {
  try {
    localStorage.setItem(CHAVE, p)
  } catch {
    /* segue só na sessão */
  }
  const t = temaEfetivo(p)
  aplicarTema(t)
  return t
}

/** Avisa quando o tema do aparelho muda (só importa com a preferência "sistema"). */
export function ouvirTemaDoSistema(fn: () => void): () => void {
  const c = consulta()
  if (!c) return () => {}
  c.addEventListener('change', fn)
  return () => c.removeEventListener('change', fn)
}
