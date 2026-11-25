import { useState } from 'react'
import { Avatar, Botao, CabecalhoTela, Cartao, Icone, Sheet, Tabs, TituloSecao } from '@/design'
import { API_URL, type Usuario } from '@/lib/api'
import type { PreferenciaTema } from '@/lib/tema'

type Props = {
  usuario: Usuario
  tema: PreferenciaTema
  aoMudarTema: (t: PreferenciaTema) => void
  aoSair: () => void
}

/** Ajustes: aparência, conta e sair. */
export function Ajustes({ usuario, tema, aoMudarTema, aoSair }: Props) {
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const nome = usuario.nome || usuario.email
  const host = API_URL.replace(/^https?:\/\//, '')

  return (
    <div>
      <CabecalhoTela titulo="Ajustes" descricao="Aparência e conta neste aparelho." />

      <div className="space-y-6">
        <section>
          <TituloSecao titulo="Aparência" />
          <Cartao>
            <p className="mb-3 text-sm text-suave">Tema do aplicativo</p>
            <Tabs<PreferenciaTema>
              cheio
              ativa={tema}
              aoTrocar={aoMudarTema}
              abas={[
                { id: 'sistema', rotulo: <><Icone n="monitor" className="h-4 w-4" />Sistema</> },
                { id: 'claro', rotulo: <><Icone n="sun" className="h-4 w-4" />Claro</> },
                { id: 'escuro', rotulo: <><Icone n="moon" className="h-4 w-4" />Escuro</> },
              ]}
            />
            <p className="mt-3 text-xs text-tenue">
              {tema === 'sistema' ? 'Acompanha a configuração do aparelho.' : 'Vale apenas para este aparelho.'}
            </p>
          </Cartao>
        </section>

        <section>
          <TituloSecao titulo="Conta" />
          <Cartao>
            <div className="flex items-center gap-4">
              <Avatar nome={nome} tamanho="lg" destaque />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-semibold text-texto">{usuario.nome || 'Sem nome'}</p>
                <p className="truncate text-sm text-suave">{usuario.email}</p>
              </div>
            </div>
            <Botao variante="secundario" cheio className="mt-4" icone={<Icone n="logOut" />} onClick={() => setConfirmandoSaida(true)}>
              Sair da conta
            </Botao>
          </Cartao>
        </section>

        <p className="text-center text-xs text-tenue">
          Conectado a <span className="font-mono">{host}</span>
        </p>
      </div>

      <Sheet
        aberto={confirmandoSaida}
        aoFechar={() => setConfirmandoSaida(false)}
        selo="Conta"
        titulo="Sair da conta?"
        largura="sm"
        rodape={
          <>
            <Botao variante="fantasma" className="flex-1" onClick={() => setConfirmandoSaida(false)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              className="flex-1"
              carregando={saindo}
              onClick={() => {
                setSaindo(true)
                aoSair()
              }}
            >
              Sair
            </Botao>
          </>
        }
      >
        <p className="text-sm text-suave">Para voltar, será necessário receber um novo código por e-mail.</p>
      </Sheet>
    </div>
  )
}
