// Utilitários sem JSX do sistema de design.

/** Junta classes ignorando falsy — evita `${a ? 'x' : ''}` espalhado. */
export function cx(...partes: Array<string | number | boolean | null | undefined>): string {
  return partes.filter(Boolean).join(' ')
}

/** true se o usuário pediu menos movimento. */
export function prefereParado(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export type TipoVibracao = 'leve' | 'sucesso' | 'aviso' | 'erro'

const PADROES: Record<TipoVibracao, number | number[]> = {
  leve: 8, // acender/apagar, escolher cor: um toque mínimo
  sucesso: 18, // salvou: um toque curto, não um alarme
  aviso: [12, 60, 12], // excluiu: dois toques
  erro: [30, 50, 30],
}

/** Vibração curta de confirmação. No-op onde não existe (iOS, desktop) ou em reduced-motion. */
export function vibrar(tipo: TipoVibracao = 'leve'): void {
  try {
    if (prefereParado()) return
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(PADROES[tipo])
  } catch {
    /* alguns navegadores lançam fora de gesto do usuário — irrelevante */
  }
}
