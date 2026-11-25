import { api } from '@/lib/api'
import type { Horario, HorarioEdicao, HorarioNovo } from '@/lib/tipos'

export const listarHorarios = () => api.get<Horario[]>('/horarios')
export const criarHorario = (h: HorarioNovo) => api.post<Horario>('/horarios', h)
export const editarHorario = (id: number, h: HorarioEdicao) => api.patch<Horario>(`/horarios/${id}`, h)
export const excluirHorario = (id: number) => api.del<null>(`/horarios/${id}`)
