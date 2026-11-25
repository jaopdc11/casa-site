import { useEffect, useState } from 'react'
import { Aviso, Botao, Campo, Chip, FileiraChips, Icone, Rotulo, Sheet, Tabs, cx, useToast, vibrar } from '@/design'
import { useCasa } from '@/lib/casa'
import { descreverComando } from '@/lib/cores'
import { DIAS_CURTOS, dataIso, horaCurta, horaDe } from '@/lib/datas'
import type { Comando, Horario } from '@/lib/tipos'
import { BrilhoOpcional, SeletorVisual, type ModoVisual } from '@/features/luz/SeletorVisual'
import { criarHorario, editarHorario, excluirHorario } from './horarios.queries'
import { horaDoHorario } from './agenda'

type Tipo = 'semanal' | 'avulso'
type ModoAvulso = 'data' | 'minutos'

type Props = {
  aberto: boolean
  aoFechar: () => void
  /** null = novo */
  horario: Horario | null
  aparelhoId: string | null
}

const ATALHOS_DIAS: Array<{ rotulo: string; dias: number[] }> = [
  { rotulo: 'Todos os dias', dias: [0, 1, 2, 3, 4, 5, 6] },
  { rotulo: 'Dias úteis', dias: [0, 1, 2, 3, 4] },
  { rotulo: 'Fins de semana', dias: [5, 6] },
]
const ATALHOS_MINUTOS = [15, 30, 60, 120]

const iguais = (a: number[], b: number[]) => [...a].sort().join() === [...b].sort().join()

function daquiAUmaHora(): Date {
  const d = new Date(Date.now() + 60 * 60_000)
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0)
  return d
}

/** Criar ou editar horário num Sheet; excluir pede confirmação no próprio Sheet. */
export function FormHorario({ aberto, aoFechar, horario, aparelhoId }: Props) {
  const toast = useToast()
  const casa = useCasa()
  const editando = !!horario

  const [tipo, setTipo] = useState<Tipo>('semanal')
  const [dias, setDias] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [hora, setHora] = useState('18:00')
  const [modoAvulso, setModoAvulso] = useState<ModoAvulso>('data')
  const [data, setData] = useState('')
  const [horaAvulso, setHoraAvulso] = useState('')
  const [minutos, setMinutos] = useState('30')
  const [acender, setAcender] = useState(true)
  const [definirBrilho, setDefinirBrilho] = useState(false)
  const [brilho, setBrilho] = useState(80)
  const [visual, setVisual] = useState<ModoVisual>('manter')
  const [temperatura, setTemperatura] = useState(30)
  const [cor, setCor] = useState('#ff6600')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  // Toda abertura começa do zero (novo) ou do horário (editar).
  useEffect(() => {
    if (!aberto) return
    const daqui = daquiAUmaHora()
    setErro(null)
    setSalvando(false)
    setConfirmandoExclusao(false)
    setModoAvulso('data')
    setMinutos('30')
    if (!horario) {
      setTipo('semanal')
      setDias([0, 1, 2, 3, 4, 5, 6])
      setHora('18:00')
      setData(dataIso(daqui))
      setHoraAvulso(horaDe(daqui))
      setAcender(true)
      setDefinirBrilho(false)
      setBrilho(80)
      setVisual('manter')
      setTemperatura(30)
      setCor('#ff6600')
      return
    }
    const a = horario.acao
    setTipo(horario.tipo)
    setDias(horario.dias ?? [0, 1, 2, 3, 4, 5, 6])
    setHora(horaCurta(horario.hora) || '18:00')
    const q = horario.quando ? new Date(horario.quando) : daqui
    setData(dataIso(q))
    setHoraAvulso(horaDe(q))
    setAcender(a.ligado !== false)
    setDefinirBrilho(!!a.brilho)
    setBrilho(a.brilho ?? 80)
    setVisual(a.cor ? 'cor' : a.temperatura !== undefined && a.temperatura !== null ? 'branco' : 'manter')
    setTemperatura(a.temperatura ?? 30)
    setCor(a.cor ?? '#ff6600')
  }, [aberto, horario])

  function montarAcao(): Comando {
    if (!acender) return { ligado: false }
    const c: Comando = { ligado: true }
    if (definirBrilho) c.brilho = brilho
    if (visual === 'branco') c.temperatura = temperatura
    if (visual === 'cor') c.cor = cor
    return c
  }

  function alternarDia(d: number) {
    vibrar('leve')
    setDias((l) => (l.includes(d) ? l.filter((x) => x !== d) : [...l, d].sort()))
  }

  async function salvar() {
    setErro(null)
    const acao = montarAcao()
    let quando: string | undefined
    let emMinutos: number | undefined

    if (tipo === 'semanal') {
      if (dias.length === 0) return setErro('Escolha pelo menos um dia da semana.')
      if (!/^\d{2}:\d{2}$/.test(hora)) return setErro('Informe o horário.')
    } else if (modoAvulso === 'minutos') {
      const n = Number(minutos)
      if (!Number.isInteger(n) || n < 1 || n > 60 * 24 * 7) return setErro('Informe de 1 a 10.080 minutos.')
      emMinutos = n
    } else {
      if (!data || !horaAvulso) return setErro('Informe a data e o horário.')
      if (new Date(`${data}T${horaAvulso}`).getTime() <= Date.now()) return setErro('Escolha um momento no futuro.')
      quando = `${data}T${horaAvulso}`
    }

    setSalvando(true)
    try {
      if (!horario) {
        if (!aparelhoId) throw new Error('Nenhum aparelho disponível.')
        await criarHorario({
          aparelho_id: aparelhoId,
          tipo,
          acao,
          ...(tipo === 'semanal' ? { dias, hora } : emMinutos ? { em_minutos: emMinutos } : { quando }),
        })
      } else if (horario.tipo === 'semanal') {
        await editarHorario(horario.id, { dias, hora, acao })
      } else {
        // editar um avulso é reagendar: volta a ficar ativo
        const alvo = emMinutos ? new Date(Date.now() + emMinutos * 60_000) : null
        await editarHorario(horario.id, { quando: alvo ? `${dataIso(alvo)}T${horaDe(alvo)}` : quando, acao, ativo: true })
      }
      vibrar('sucesso')
      toast.mostrar(editando ? 'Horário atualizado' : 'Horário criado')
      void casa.recarregar('horarios')
      aoFechar()
    } catch (e) {
      vibrar('erro')
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o horário.')
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!horario) return
    setSalvando(true)
    try {
      await excluirHorario(horario.id)
      casa.mudarHorarios((l) => l.filter((h) => h.id !== horario.id))
      vibrar('aviso')
      toast.mostrar('Horário excluído')
      aoFechar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir o horário.')
      setSalvando(false)
    }
  }

  if (confirmandoExclusao && horario) {
    return (
      <Sheet
        aberto={aberto}
        aoFechar={aoFechar}
        selo="Horários"
        titulo="Excluir horário?"
        largura="sm"
        rodape={
          <>
            <Botao variante="fantasma" className="flex-1" onClick={() => setConfirmandoExclusao(false)}>
              Manter
            </Botao>
            <Botao variante="perigo" className="flex-1" carregando={salvando} onClick={() => void excluir()}>
              Excluir
            </Botao>
          </>
        }
      >
        <p className="text-sm text-suave">
          <span className="font-medium text-texto">{descreverComando(horario.acao)}</span> às{' '}
          <span className="font-mono text-texto">{horaDoHorario(horario)}</span> deixará de acontecer. Esta ação não pode ser desfeita.
        </p>
        {erro && <Aviso className="mt-4">{erro}</Aviso>}
      </Sheet>
    )
  }

  return (
    <Sheet
      aberto={aberto}
      aoFechar={aoFechar}
      selo="Horários"
      titulo={editando ? 'Editar horário' : 'Novo horário'}
      rodape={
        <>
          <Botao variante="fantasma" className="flex-1" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao className="flex-1" carregando={salvando} onClick={() => void salvar()}>
            Salvar
          </Botao>
        </>
      }
    >
      <div className="space-y-6">
        {!editando && (
          <Tabs<Tipo>
            cheio
            ativa={tipo}
            aoTrocar={setTipo}
            abas={[
              { id: 'semanal', rotulo: <><Icone n="repeat" className="h-4 w-4" />Toda semana</> },
              { id: 'avulso', rotulo: <><Icone n="calendar" className="h-4 w-4" />Uma vez</> },
            ]}
          />
        )}

        {tipo === 'semanal' ? (
          <section className="space-y-4">
            <div>
              <Rotulo>Dias</Rotulo>
              <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Dias da semana">
                {DIAS_CURTOS.map((nome, i) => {
                  const on = dias.includes(i)
                  return (
                    <button
                      key={nome}
                      type="button"
                      aria-pressed={on}
                      onClick={() => alternarDia(i)}
                      className={cx(
                        'flex min-h-11 items-center justify-center rounded-card border text-sm font-medium capitalize transition-[transform,background-color,border-color,color] duration-150 ease-suave active:scale-[0.94]',
                        on ? 'border-acento bg-tinta-acento text-acento' : 'border-borda bg-campo text-suave hover:text-texto',
                      )}
                    >
                      {nome}
                    </button>
                  )
                })}
              </div>
              <FileiraChips className="mt-3">
                {ATALHOS_DIAS.map((a) => (
                  <Chip key={a.rotulo} ativo={iguais(a.dias, dias)} aoTocar={() => setDias(a.dias)}>
                    {a.rotulo}
                  </Chip>
                ))}
              </FileiraChips>
            </div>
            <Campo rotulo="Horário" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="font-mono" required />
          </section>
        ) : (
          <section className="space-y-4">
            <Tabs<ModoAvulso>
              cheio
              tom="neutro"
              ativa={modoAvulso}
              aoTrocar={setModoAvulso}
              abas={[
                { id: 'data', rotulo: 'Data e hora' },
                { id: 'minutos', rotulo: 'Daqui a…' },
              ]}
            />
            {modoAvulso === 'data' ? (
              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Data" type="date" value={data} min={dataIso(new Date())} onChange={(e) => setData(e.target.value)} className="font-mono" />
                <Campo rotulo="Horário" type="time" value={horaAvulso} onChange={(e) => setHoraAvulso(e.target.value)} className="font-mono" />
              </div>
            ) : (
              <div>
                <Campo
                  rotulo="Minutos a partir de agora"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10080}
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value.replace(/\D/g, ''))}
                  className="font-mono"
                />
                <FileiraChips className="mt-3">
                  {ATALHOS_MINUTOS.map((m) => (
                    <Chip key={m} ativo={minutos === String(m)} aoTocar={() => setMinutos(String(m))}>
                      <span className="font-mono">{m >= 60 ? `${m / 60} h` : `${m} min`}</span>
                    </Chip>
                  ))}
                </FileiraChips>
              </div>
            )}
          </section>
        )}

        <section className="space-y-4 border-t border-borda pt-5">
          <div>
            <Rotulo>Ação</Rotulo>
            <Tabs<'acender' | 'apagar'>
              cheio
              ativa={acender ? 'acender' : 'apagar'}
              aoTrocar={(v) => setAcender(v === 'acender')}
              abas={[
                { id: 'acender', rotulo: <><Icone n="lampada" className="h-4 w-4" />Acender</> },
                { id: 'apagar', rotulo: <><Icone n="power" className="h-4 w-4" />Apagar</> },
              ]}
            />
          </div>
          {acender && (
            <div className="animate-fade space-y-5">
              <BrilhoOpcional ativo={definirBrilho} aoAtivar={setDefinirBrilho} brilho={brilho} aoMudar={setBrilho} />
              <div>
                <Rotulo>Visual</Rotulo>
                <SeletorVisual
                  permitirManter
                  modo={visual}
                  aoMudarModo={setVisual}
                  temperatura={temperatura}
                  aoMudarTemperatura={setTemperatura}
                  cor={cor}
                  aoMudarCor={setCor}
                />
              </div>
            </div>
          )}
          <p className="rounded-card bg-superficie-alta px-3.5 py-2.5 text-sm text-suave">
            <span className="text-tenue">Resumo: </span>
            <span className="font-medium text-texto">{descreverComando(montarAcao())}</span>
          </p>
        </section>

        {erro && <Aviso className="animate-fade">{erro}</Aviso>}

        {editando && (
          <Botao variante="perigo" cheio icone={<Icone n="trash" />} onClick={() => setConfirmandoExclusao(true)}>
            Excluir horário
          </Botao>
        )}
      </div>
    </Sheet>
  )
}
