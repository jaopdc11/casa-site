// Datas e horas em pt-BR. Tudo no fuso do aparelho (a casa e quem usa estão em Brasília).

/** 0 = seg … 6 = dom, como na API. */
export const DIAS_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'] as const
export const DIAS_LETRA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const

export function diasTexto(dias: number[]): string {
  const d = [...new Set(dias)].sort((a, b) => a - b)
  if (d.length === 7) return 'Todos os dias'
  if (d.join() === '0,1,2,3,4') return 'Dias úteis'
  if (d.join() === '5,6') return 'Fins de semana'
  const nomes = d.map((i) => DIAS_CURTOS[i]!)
  if (nomes.length === 1) return nomes[0]!
  return nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1]
}

/** 'HH:MM:SS' → 'HH:MM' */
export function horaCurta(h: string | null | undefined): string {
  return (h ?? '').slice(0, 5)
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

export function horaDe(d: Date): string {
  return `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
}

/** Date → 'YYYY-MM-DD' local (para <input type="date">). */
export function dataIso(d: Date): string {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** "hoje" / "amanhã" / "ontem" / "25/11" */
export function diaRelativo(d: Date, agora = new Date()): string {
  const amanha = new Date(agora)
  amanha.setDate(agora.getDate() + 1)
  const ontem = new Date(agora)
  ontem.setDate(agora.getDate() - 1)
  if (mesmoDia(d, agora)) return 'hoje'
  if (mesmoDia(d, amanha)) return 'amanhã'
  if (mesmoDia(d, ontem)) return 'ontem'
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`
}

/** Cabeçalho de grupo no histórico: "Hoje", "Ontem", "Segunda-feira, 23 de novembro". */
export function rotuloDoDia(d: Date, agora = new Date()): string {
  const rel = diaRelativo(d, agora)
  if (rel === 'hoje') return 'Hoje'
  if (rel === 'ontem') return 'Ontem'
  const texto = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(d.getFullYear() !== agora.getFullYear() ? { year: 'numeric' } : {}),
  })
  return texto[0]!.toUpperCase() + texto.slice(1)
}

/** Chave estável do dia local (para agrupar). */
export function chaveDoDia(d: Date): string {
  return dataIso(d)
}

/** Saudação pela hora do dia. */
export function saudacao(agora = new Date()): string {
  const h = agora.getHours()
  if (h < 5) return 'Boa noite'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
