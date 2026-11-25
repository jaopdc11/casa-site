import { corDoBranco, nomeDaCor, nomeDaTemperatura } from '@/lib/cores'
import type { Preset } from '@/lib/tipos'

/** "Branco quente · 40%" / "Laranja · 30%" / "#ff5a1f" */
export function descreverPreset(p: Pick<Preset, 'cor' | 'temperatura' | 'brilho'>): string {
  const visual = p.cor ? nomeDaCor(p.cor) : nomeDaTemperatura(p.temperatura ?? 50)
  const texto = [visual, p.brilho ? `${p.brilho}%` : null].filter(Boolean).join(' · ')
  return texto[0]!.toUpperCase() + texto.slice(1)
}

/** Cor da amostra: a cor do preset ou a aproximação do branco dele. */
export function amostraDoPreset(p: Pick<Preset, 'cor' | 'temperatura'>): string {
  return p.cor ?? corDoBranco(p.temperatura)
}
