import { useMemo, useState } from 'react'
import { Aviso, Badge, Botao, CabecalhoTela, EsqueletoLista, Icone, Interruptor, Lista, TituloSecao, Vazio, cx, useToast, vibrar } from '@/design'
import { useCasa } from '@/lib/casa'
import { corDoVisual, descreverComando } from '@/lib/cores'
import { DIAS_LETRA, DIAS_CURTOS, diaRelativo } from '@/lib/datas'
import type { Horario } from '@/lib/tipos'
import { raizes } from '@/features/luz/luz.queries'
import { concluido, horaDoHorario, proximaExecucao, quandoTexto } from './agenda'
import { FormHorario } from './FormHorario'
import { editarHorario } from './horarios.queries'

/** Horários: semanais e avulsos, ativar/pausar na linha, criar/editar num Sheet. */
export function Horarios() {
  const casa = useCasa()
  const toast = useToast()
  const { horarios, aparelhos } = casa
  const [editando, setEditando] = useState<Horario | null>(null)
  const [aberto, setAberto] = useState(false)

  const aparelhoId = useMemo(() => (aparelhos.dados ? (raizes(aparelhos.dados)[0]?.id ?? null) : null), [aparelhos.dados])
  const nomes = useMemo(() => new Map((aparelhos.dados ?? []).map((a) => [a.id, a.nome])), [aparelhos.dados])
  const variosAparelhos = useMemo(() => new Set((horarios.dados ?? []).map((h) => h.aparelho_id)).size > 1, [horarios.dados])

  const { semanais, avulsos } = useMemo(() => {
    const l = horarios.dados ?? []
    return { semanais: l.filter((h) => h.tipo === 'semanal'), avulsos: l.filter((h) => h.tipo === 'avulso') }
  }, [horarios.dados])

  function abrirNovo() {
    setEditando(null)
    setAberto(true)
  }
  function abrirEdicao(h: Horario) {
    setEditando(h)
    setAberto(true)
  }

  async function alternar(h: Horario, ativo: boolean) {
    vibrar('leve')
    casa.mudarHorarios((l) => l.map((x) => (x.id === h.id ? { ...x, ativo } : x)))
    try {
      const novo = await editarHorario(h.id, { ativo })
      casa.mudarHorarios((l) => l.map((x) => (x.id === h.id ? novo : x)))
      toast.mostrar(ativo ? 'Horário ativado' : 'Horário pausado', { tom: 'info', duracaoMs: 1800 })
    } catch (e) {
      casa.mudarHorarios((l) => l.map((x) => (x.id === h.id ? { ...x, ativo: h.ativo } : x)))
      vibrar('erro')
      toast.mostrar(e instanceof Error ? e.message : 'Não foi possível alterar o horário.', { tom: 'erro' })
    }
  }

  const linha = (h: Horario) => (
    <LinhaHorario
      key={h.id}
      h={h}
      nomeAparelho={variosAparelhos ? nomes.get(h.aparelho_id) : undefined}
      aoTocar={() => abrirEdicao(h)}
      aoAlternar={(v) => void alternar(h, v)}
    />
  )

  return (
    <div>
      <CabecalhoTela
        titulo="Horários"
        descricao="A luz acende e apaga sozinha nos horários definidos."
        acao={
          <Botao tamanho="sm" icone={<Icone n="plus" />} onClick={abrirNovo} disabled={!aparelhoId}>
            Novo
          </Botao>
        }
      />

      {horarios.erro && (
        <Aviso className="mb-4" aoTentarDeNovo={() => void casa.recarregar('horarios')}>
          {horarios.erro}
        </Aviso>
      )}

      {horarios.carregando && !horarios.dados ? (
        <Lista>
          <EsqueletoLista linhas={4} />
        </Lista>
      ) : horarios.dados && horarios.dados.length === 0 ? (
        <Vazio
          icone="clock"
          titulo="Nenhum horário programado."
          descricao="Programe a luz para acender ao entardecer ou apagar na hora de dormir."
          acao={
            <Botao icone={<Icone n="plus" />} onClick={abrirNovo} disabled={!aparelhoId}>
              Criar horário
            </Botao>
          }
        />
      ) : horarios.dados ? (
        <div className="space-y-6">
          {semanais.length > 0 && (
            <section>
              <TituloSecao selo={`${semanais.length} ${semanais.length === 1 ? 'horário' : 'horários'}`} titulo="Toda semana" />
              <Lista cascata>{semanais.map(linha)}</Lista>
            </section>
          )}
          {avulsos.length > 0 && (
            <section>
              <TituloSecao selo={`${avulsos.length} ${avulsos.length === 1 ? 'horário' : 'horários'}`} titulo="Uma vez" />
              <Lista cascata>{avulsos.map(linha)}</Lista>
            </section>
          )}
        </div>
      ) : null}

      <FormHorario aberto={aberto} aoFechar={() => setAberto(false)} horario={editando} aparelhoId={editando?.aparelho_id ?? aparelhoId} />
    </div>
  )
}

function LinhaHorario({
  h,
  nomeAparelho,
  aoTocar,
  aoAlternar,
}: {
  h: Horario
  nomeAparelho?: string
  aoTocar: () => void
  aoAlternar: (v: boolean) => void
}) {
  const feito = concluido(h)
  const proxima = proximaExecucao(h)
  const amostra = h.acao.ligado === false ? null : corDoVisual(h.acao)

  return (
    <li className="flex items-center">
      <button
        type="button"
        onClick={aoTocar}
        className={cx(
          'flex min-h-[4.5rem] min-w-0 flex-1 items-center gap-3.5 px-4 py-3 text-left transition-[transform,background-color,opacity] duration-150 ease-suave hover:bg-superficie-alta/50 active:scale-[0.985]',
          !h.ativo && 'opacity-55',
        )}
      >
        <span
          className={cx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]',
            h.acao.ligado === false ? 'bg-superficie-alta text-suave' : !amostra && 'bg-tinta-acento text-acento',
          )}
          style={amostra ? { backgroundColor: `${amostra}2e`, color: amostra } : undefined}
        >
          <Icone n={h.acao.ligado === false ? 'power' : 'lampada'} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-mono text-xl font-semibold leading-tight text-texto">{horaDoHorario(h)}</span>
            {feito ? <Badge>Concluído</Badge> : !h.ativo ? <Badge tom="atencao">Pausado</Badge> : null}
          </span>
          <span className="mt-0.5 block truncate text-sm text-suave">
            {descreverComando(h.acao)}
            {nomeAparelho && <span className="text-tenue"> · {nomeAparelho}</span>}
          </span>
          {h.tipo === 'semanal' ? (
            <span className="mt-1.5 flex gap-1" aria-label={`Dias: ${(h.dias ?? []).map((d) => DIAS_CURTOS[d]).join(', ')}`}>
              {DIAS_LETRA.map((letra, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={cx(
                    'flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-semibold',
                    h.dias?.includes(i) ? 'bg-tinta-acento text-acento' : 'text-tenue',
                  )}
                >
                  {letra}
                </span>
              ))}
            </span>
          ) : (
            <span className="mt-1 block font-mono text-xs text-tenue">
              {h.quando ? (feito ? `Executado ${diaRelativo(new Date(h.quando))}` : proxima ? quandoTexto(proxima) : `${diaRelativo(new Date(h.quando))}, já passou`) : ''}
            </span>
          )}
        </span>
      </button>
      <span className="shrink-0 pr-2">
        <Interruptor ligado={h.ativo} aoMudar={aoAlternar} rotulo={h.ativo ? 'Pausar horário' : 'Ativar horário'} />
      </span>
    </li>
  )
}
