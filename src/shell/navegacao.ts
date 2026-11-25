import type { NomeIcone } from '@/lib/icones'

// Todas as vistas do app. Cabem as cinco na nav inferior; no desktop, na sidebar.
export type Vista = 'inicio' | 'horarios' | 'presets' | 'historico' | 'ajustes'

export type ItemVista = { id: Vista; rotulo: string; icone: NomeIcone; descricao: string }

export const ABAS: ItemVista[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'lampada', descricao: 'Luz e controles' },
  { id: 'horarios', rotulo: 'Horários', icone: 'clock', descricao: 'Acender e apagar sozinha' },
  { id: 'presets', rotulo: 'Presets', icone: 'palette', descricao: 'Visuais salvos' },
  { id: 'historico', rotulo: 'Histórico', icone: 'history', descricao: 'O que aconteceu e quem fez' },
  { id: 'ajustes', rotulo: 'Ajustes', icone: 'settings', descricao: 'Tema e conta' },
]

export function rotuloDe(v: Vista): string {
  return ABAS.find((i) => i.id === v)?.rotulo ?? ''
}
