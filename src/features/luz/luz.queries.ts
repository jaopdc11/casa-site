import { api } from '@/lib/api'
import type { Aparelho, Comando, RespostaComando } from '@/lib/tipos'

export const listarAparelhos = () => api.get<Aparelho[]>('/aparelhos')

/** Lê todas as lâmpadas na nuvem agora: pega o que mudou pelo interruptor ou pelo app da Tuya. */
export const atualizarAparelhos = () => api.post<Aparelho[]>('/aparelhos/atualizar', {})

/** 502 = a lâmpada (ou a nuvem dela) não respondeu. */
export const comandar = (aparelhoId: string, c: Comando) =>
  api.post<RespostaComando>(`/aparelhos/${encodeURIComponent(aparelhoId)}/comando`, c)

/** Só os aparelhos que a gente nomeia no dia a dia (não membros de grupo). */
export const raizes = (lista: Aparelho[]) => lista.filter((a) => a.grupos.length === 0)
