import { useMemo, useState } from 'react'
import { Aviso, Badge, CabecalhoTela, EsqueletoLista, Icone, LinhaLista, Lista, Selo, Sheet, Tabs, Vazio, cx, type NomeIcone } from '@/design'
import { useCasa } from '@/lib/casa'
import { descreverComando } from '@/lib/cores'
import { chaveDoDia, horaDe, rotuloDoDia } from '@/lib/datas'
import type { Comando, EventoLog } from '@/lib/tipos'

type Filtro = 'todos' | 'falhas'

const ORIGENS: Record<string, { rotulo: string; icone: NomeIcone }> = {
  app: { rotulo: 'Aplicativo', icone: 'smartphone' },
  argos: { rotulo: 'WhatsApp', icone: 'message' },
  horario: { rotulo: 'Horário programado', icone: 'clock' },
  externo: { rotulo: 'Smart Life', icone: 'cloud' },
  api: { rotulo: 'API', icone: 'code' },
}

const origemDe = (o: string) => ORIGENS[o] ?? { rotulo: o, icone: 'history' as NomeIcone }

/** Frase do evento. Em 'externo' a ação é o que mudou, não um comando. */
export function descreverEvento(ev: EventoLog): string {
  const a = ev.acao ?? {}
  if (ev.origem === 'externo') {
    if (a.online === false) return 'Lâmpada ficou sem conexão'
    const c: Comando = {}
    if (typeof a.ligado === 'boolean') c.ligado = a.ligado
    if (a.ligado !== false) {
      if (a.cor && a.modo !== 'white') c.cor = a.cor
      else if (typeof a.temperatura === 'number' && a.modo !== 'colour') c.temperatura = a.temperatura
      if (typeof a.brilho === 'number') c.brilho = a.brilho
    }
    if (Object.keys(c).length > 0) return descreverComando(c, 'passado')
    if (a.online === true) return 'Lâmpada voltou a responder'
    if (a.modo) return 'Modo da lâmpada alterado'
    return 'Estado alterado'
  }
  return descreverComando(a as Comando, 'passado')
}

/** Histórico: o que aconteceu, por quem e por onde, agrupado por dia. */
export function Historico() {
  const { eventos, aparelhos, recarregar } = useCasa()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [aberto, setAberto] = useState<EventoLog | null>(null)

  const nomes = useMemo(() => new Map((aparelhos.dados ?? []).map((a) => [a.id, a.nome])), [aparelhos.dados])
  const falhas = useMemo(() => (eventos.dados ?? []).filter((e) => e.resultado === 'erro').length, [eventos.dados])

  const grupos = useMemo(() => {
    const l = (eventos.dados ?? []).filter((e) => filtro === 'todos' || e.resultado === 'erro')
    const mapa = new Map<string, { rotulo: string; itens: EventoLog[] }>()
    const agora = new Date()
    for (const ev of l) {
      const d = new Date(ev.em)
      const k = chaveDoDia(d)
      if (!mapa.has(k)) mapa.set(k, { rotulo: rotuloDoDia(d, agora), itens: [] })
      mapa.get(k)!.itens.push(ev)
    }
    return [...mapa.entries()]
  }, [eventos.dados, filtro])

  return (
    <div>
      <CabecalhoTela titulo="Histórico" descricao="As ações mais recentes na casa, de todas as origens." />

      {eventos.erro && (
        <Aviso className="mb-4" aoTentarDeNovo={() => void recarregar('eventos')}>
          {eventos.erro}
        </Aviso>
      )}

      {eventos.dados && eventos.dados.length > 0 && (
        <Tabs<Filtro>
          className="mb-5"
          ativa={filtro}
          aoTrocar={setFiltro}
          abas={[
            { id: 'todos', rotulo: 'Todos' },
            { id: 'falhas', rotulo: 'Falhas', badge: falhas },
          ]}
        />
      )}

      {eventos.carregando && !eventos.dados ? (
        <Lista>
          <EsqueletoLista linhas={6} />
        </Lista>
      ) : eventos.dados && eventos.dados.length === 0 ? (
        <Vazio icone="history" titulo="Nada registrado ainda." descricao="Cada comando, de qualquer origem, aparece aqui." />
      ) : grupos.length === 0 ? (
        <Vazio icone="check" titulo="Nenhuma falha recente." descricao="Todos os comandos registrados foram executados." />
      ) : (
        <div className="space-y-6">
          {grupos.map(([k, g]) => (
            <section key={k}>
              <Selo className="mb-2.5 px-1">{g.rotulo}</Selo>
              <Lista>
                {g.itens.map((ev) => (
                  <LinhaEvento key={ev.id} ev={ev} aoTocar={() => setAberto(ev)} />
                ))}
              </Lista>
            </section>
          ))}
        </div>
      )}

      <Sheet aberto={!!aberto} aoFechar={() => setAberto(null)} selo="Histórico" titulo={aberto ? descreverEvento(aberto) : ''} largura="sm">
        {aberto && <DetalheEvento ev={aberto} nomeAparelho={aberto.aparelho_id ? nomes.get(aberto.aparelho_id) ?? aberto.aparelho_id : null} />}
      </Sheet>
    </div>
  )
}

function IconeOrigem({ origem, erro }: { origem: string; erro: boolean }) {
  return (
    <span
      className={cx(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]',
        erro ? 'bg-superficie text-perigo' : 'bg-superficie-alta text-suave',
      )}
    >
      <Icone n={origemDe(origem).icone} className="h-5 w-5" />
    </span>
  )
}

function LinhaEvento({ ev, aoTocar }: { ev: EventoLog; aoTocar: () => void }) {
  const erro = ev.resultado === 'erro'
  const o = origemDe(ev.origem)
  return (
    <LinhaLista
      className={cx(erro && 'bg-tinta-perigo')}
      inicio={<IconeOrigem origem={ev.origem} erro={erro} />}
      titulo={
        <span className="flex items-center gap-2">
          <span className="truncate">{descreverEvento(ev)}</span>
          {erro && <Badge tom="perigo">Falhou</Badge>}
        </span>
      }
      subtitulo={erro && ev.detalhe ? <span className="text-perigo">{ev.detalhe}</span> : [o.rotulo, ev.autor].filter(Boolean).join(' · ')}
      fim={<span className="font-mono text-xs text-tenue">{horaDe(new Date(ev.em))}</span>}
      aoTocar={aoTocar}
    />
  )
}

// Textos fixos que a API grava em português informal: versão para a interface.
function detalheLegivel(d: string): string {
  if (d === 'mudou por fora da API') return 'Alteração feita fora deste sistema (aplicativo Smart Life ou interruptor).'
  return d
}

function DetalheEvento({ ev, nomeAparelho }: { ev: EventoLog; nomeAparelho: string | null }) {
  const o = origemDe(ev.origem)
  const d = new Date(ev.em)
  const linhas: Array<[string, React.ReactNode]> = [
    ['Origem', o.rotulo],
    ['Autor', ev.autor ?? '—'],
    ['Aparelho', nomeAparelho ?? '—'],
    ['Quando', <span className="font-mono">{d.toLocaleDateString('pt-BR')} às {d.toLocaleTimeString('pt-BR')}</span>],
    ['Resultado', ev.resultado === 'ok' ? <Badge tom="sucesso">Executado</Badge> : <Badge tom="perigo">Falhou</Badge>],
  ]
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-borda overflow-hidden rounded-card border border-borda">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-tenue">{rotulo}</dt>
            <dd className="min-w-0 truncate text-right text-texto">{valor}</dd>
          </div>
        ))}
      </dl>
      {ev.detalhe && (
        <Aviso tom={ev.resultado === 'erro' ? 'perigo' : 'acento'}>
          <span className="break-words">{detalheLegivel(ev.detalhe)}</span>
        </Aviso>
      )}
    </div>
  )
}
