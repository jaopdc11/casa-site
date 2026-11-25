// Espelho dos formatos da API (repo casa: app/comando.py e app/modules/*).

export type Modo = 'white' | 'colour' | 'scene' | 'music'

/** Estado normalizado de um aparelho. null em qualquer campo = desconhecido. */
export type Estado = {
  ligado: boolean | null
  modo: Modo | null
  /** 1–100 */
  brilho: number | null
  /** 0 = quente … 100 = frio */
  temperatura: number | null
  /** #rrggbb minúsculo */
  cor: string | null
  online: boolean | null
  lido_em?: string | null
}

export type Aparelho = {
  id: string
  nome: string
  apelidos: string[]
  tipo?: string
  adaptador: string
  membros: string[]
  grupos: string[]
  /** null = nunca lido */
  estado: Estado | null
}

/** Comando normalizado. Cor e temperatura não andam juntas; apagar não leva nada além. */
export type Comando = {
  ligado?: boolean
  brilho?: number
  temperatura?: number
  cor?: string
}

export type RespostaComando = { aparelho: string; falhas: Record<string, string>; estado: Estado | null }

export type Horario = {
  id: number
  aparelho_id: string
  tipo: 'semanal' | 'avulso'
  /** 0 = seg … 6 = dom (semanal) */
  dias: number[] | null
  /** 'HH:MM:SS' (semanal) */
  hora: string | null
  /** ISO com fuso (avulso) */
  quando: string | null
  acao: Comando
  ativo: boolean
  criado_por?: string | null
  ultimo_disparo: string | null
}

export type HorarioNovo = {
  aparelho_id: string
  tipo: 'semanal' | 'avulso'
  dias?: number[]
  hora?: string
  /** 'YYYY-MM-DDTHH:MM' sem fuso = horário de Brasília na API */
  quando?: string
  em_minutos?: number
  acao: Comando
}

export type HorarioEdicao = {
  ativo?: boolean
  dias?: number[]
  hora?: string
  quando?: string
  acao?: Comando
}

export type Preset = {
  id: number
  nome: string
  cor: string | null
  temperatura: number | null
  brilho: number | null
  criado_por?: string | null
}

export type PresetNovo = { nome: string; cor?: string; temperatura?: number; brilho?: number }

export type Origem = 'api' | 'argos' | 'horario' | 'externo' | 'app'

export type EventoLog = {
  id: number
  aparelho_id: string | null
  origem: Origem | string
  autor: string | null
  /** o comando; em 'externo', o que mudou (pode trazer online/modo) */
  acao: Partial<Estado> & Comando
  resultado: 'ok' | 'erro'
  detalhe: string | null
  em: string
}
