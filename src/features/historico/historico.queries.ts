import { api } from '@/lib/api'
import type { EventoLog } from '@/lib/tipos'

export const listarEventos = (limite = 150) => api.get<EventoLog[]>(`/eventos?limite=${limite}`)
