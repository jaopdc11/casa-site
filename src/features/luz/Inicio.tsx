import { useMemo } from 'react'
import { Aviso, CabecalhoTela, Cartao, Esqueleto, Icone, Selo, Vazio } from '@/design'
import type { Usuario } from '@/lib/api'
import { useCasa } from '@/lib/casa'
import { descreverComando } from '@/lib/cores'
import { saudacao } from '@/lib/datas'
import { proximoHorario, quandoTexto } from '@/features/horarios/agenda'
import { CartaoLuz } from './CartaoLuz'
import { raizes } from './luz.queries'

type Props = { usuario: Usuario; aoVerHorarios: () => void }

/** Início: um cartão por aparelho raiz (hoje, a luz do quarto) e o próximo horário. */
export function Inicio({ usuario, aoVerHorarios }: Props) {
  const { aparelhos, presets, horarios, recarregar } = useCasa()
  const lista = useMemo(() => (aparelhos.dados ? raizes(aparelhos.dados) : null), [aparelhos.dados])
  const proximo = useMemo(() => (horarios.dados ? proximoHorario(horarios.dados) : null), [horarios.dados])
  const primeiroNome = usuario.nome?.split(' ')[0]

  return (
    <div>
      <CabecalhoTela selo={primeiroNome ? `${saudacao()}, ${primeiroNome}` : saudacao()} titulo="Início" />

      {aparelhos.erro && !lista && (
        <Aviso className="mb-4" aoTentarDeNovo={() => void recarregar('aparelhos')}>
          {aparelhos.erro}
        </Aviso>
      )}

      {aparelhos.carregando && !lista ? (
        <EsqueletoCartaoLuz />
      ) : lista && lista.length === 0 ? (
        <Vazio
          icone="lampada"
          titulo="Nenhum aparelho cadastrado ainda."
          descricao="Os aparelhos são cadastrados na API da casa e aparecem aqui automaticamente."
        />
      ) : lista ? (
        <div className="cascata grid gap-4 lg:grid-cols-2">
          {lista.map((ap) => (
            <CartaoLuz key={ap.id} aparelho={ap} presets={presets.dados ?? []} />
          ))}
        </div>
      ) : null}

      {lista && lista.length > 0 && (
        <Cartao aoTocar={aoVerHorarios} className="mt-4 animate-subir">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-superficie-alta text-suave">
              <Icone n="clock" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <Selo className="mb-1.5">Próximo horário</Selo>
              {proximo ? (
                <p className="truncate text-sm text-texto">
                  <span className="font-medium">{descreverComando(proximo.horario.acao)}</span>
                  <span className="text-suave"> · </span>
                  <span className="font-mono text-suave">{quandoTexto(proximo.quando)}</span>
                </p>
              ) : (
                <p className="truncate text-sm text-suave">{horarios.carregando ? 'Carregando…' : 'Nenhum horário ativo.'}</p>
              )}
            </div>
            <Icone n="chevronRight" className="h-4 w-4 shrink-0 text-tenue" />
          </div>
        </Cartao>
      )}
    </div>
  )
}

function EsqueletoCartaoLuz() {
  return (
    <Cartao className="space-y-6 p-5" aria-busy="true">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Esqueleto className="h-5 w-40" />
          <Esqueleto className="h-3.5 w-28" />
        </div>
        <Esqueleto className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center gap-5">
        <Esqueleto className="h-20 w-20 rounded-[24px]" />
        <Esqueleto className="h-10 w-24" />
      </div>
      <Esqueleto className="h-3 w-full rounded-full" />
      <Esqueleto className="h-11 w-full rounded-card" />
      <Esqueleto className="h-3 w-full rounded-full" />
    </Cartao>
  )
}
