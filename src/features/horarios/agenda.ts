import { diaRelativo, horaCurta, horaDe } from '@/lib/datas'
import type { Horario } from '@/lib/tipos'

/** Próxima vez que o horário dispara (no fuso do aparelho), ou null se não vai disparar. */
export function proximaExecucao(h: Horario, agora = new Date()): Date | null {
  if (!h.ativo) return null
  if (h.tipo === 'avulso') {
    const q = h.quando ? new Date(h.quando) : null
    return q && q.getTime() > agora.getTime() - 60_000 ? q : null
  }
  if (!h.dias?.length || !h.hora) return null
  const [hh, mm] = h.hora.split(':').map(Number) as [number, number]
  for (let i = 0; i < 8; i++) {
    const d = new Date(agora)
    d.setDate(agora.getDate() + i)
    d.setHours(hh, mm, 0, 0)
    const dia = (d.getDay() + 6) % 7 // JS: 0 = domingo; API: 0 = segunda
    if (h.dias.includes(dia) && d > agora) return d
  }
  return null
}

/** O horário que vem primeiro entre os ativos. */
export function proximoHorario(lista: Horario[], agora = new Date()): { horario: Horario; quando: Date } | null {
  let melhor: { horario: Horario; quando: Date } | null = null
  for (const h of lista) {
    const q = proximaExecucao(h, agora)
    if (q && (!melhor || q < melhor.quando)) melhor = { horario: h, quando: q }
  }
  return melhor
}

/** "hoje às 18:00" / "amanhã às 07:30" / "25/11 às 22:00" */
export function quandoTexto(d: Date, agora = new Date()): string {
  return `${diaRelativo(d, agora)} às ${horaDe(d)}`
}

/** Hora exibida grande na linha: a do semanal ou a do avulso. */
export function horaDoHorario(h: Horario): string {
  if (h.tipo === 'semanal') return horaCurta(h.hora)
  return h.quando ? horaDe(new Date(h.quando)) : '--:--'
}

/** Avulso que já disparou (a API desativa depois do disparo). */
export function concluido(h: Horario): boolean {
  return h.tipo === 'avulso' && !h.ativo && !!h.ultimo_disparo && !!h.quando && new Date(h.ultimo_disparo) >= new Date(h.quando)
}
