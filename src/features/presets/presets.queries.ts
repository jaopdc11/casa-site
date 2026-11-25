import { api } from '@/lib/api'
import type { Preset, PresetNovo, RespostaComando } from '@/lib/tipos'

export const listarPresets = () => api.get<Preset[]>('/presets')
export const criarPreset = (p: PresetNovo) => api.post<Preset>('/presets', p)
export const excluirPreset = (id: number) => api.del<null>(`/presets/${id}`)
export const aplicarPreset = (id: number, aparelhoId: string) =>
  api.post<RespostaComando>(`/presets/${id}/aplicar/${encodeURIComponent(aparelhoId)}`)
