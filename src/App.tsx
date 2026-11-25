import { useEffect, useState } from 'react'
import { useSessao } from '@/features/auth/useSessao'
import { Login } from '@/features/auth/Login'
import { Inicio } from '@/features/luz/Inicio'
import { Horarios } from '@/features/horarios/Horarios'
import { Presets } from '@/features/presets/Presets'
import { Historico } from '@/features/historico/Historico'
import { ProvedorToast } from '@/design'
import { sair, type Usuario } from '@/lib/api'
import { ProvedorCasa } from '@/lib/casa'
import { aplicarTema, definirTema, ouvirTemaDoSistema, preferenciaTema, temaEfetivo, type PreferenciaTema } from '@/lib/tema'
import { Ajustes } from '@/shell/Ajustes'
import { NavInferior } from '@/shell/NavInferior'
import { Sidebar } from '@/shell/Sidebar'
import { TopBar } from '@/shell/TopBar'
import { ABAS, type Vista } from '@/shell/navegacao'

// Última aba aberta: conveniência por aparelho (reabrir o PWA volta onde estava).
const VISTA = 'casa:vista'

function vistaSalva(): Vista {
  try {
    const v = sessionStorage.getItem(VISTA)
    if (ABAS.some((a) => a.id === v)) return v as Vista
  } catch {
    /* sem storage: começa no Início */
  }
  return 'inicio'
}

// O provider do toast envolve tudo (inclusive login): qualquer tela pode confirmar.
export function App() {
  return (
    <ProvedorToast>
      <Raiz />
    </ProvedorToast>
  )
}

function Raiz() {
  const { sessao, carregando } = useSessao()
  const [tema, setTema] = useState<PreferenciaTema>(preferenciaTema)

  // Com "sistema", acompanha o aparelho trocando de tema com o app aberto.
  useEffect(
    () =>
      ouvirTemaDoSistema(() => {
        if (preferenciaTema() === 'sistema') aplicarTema(temaEfetivo('sistema'))
      }),
    [],
  )

  function mudarTema(t: PreferenciaTema) {
    definirTema(t)
    setTema(t)
  }

  if (carregando) return <Tela />
  if (!sessao) return <Login />

  // ProvedorCasa só existe logado: sair desmonta e fecha o SSE junto.
  return (
    <ProvedorCasa>
      <Shell usuario={sessao} tema={tema} aoMudarTema={mudarTema} />
    </ProvedorCasa>
  )
}

function Shell({ usuario, tema, aoMudarTema }: { usuario: Usuario; tema: PreferenciaTema; aoMudarTema: (t: PreferenciaTema) => void }) {
  const [vista, setVista] = useState<Vista>(vistaSalva)

  function irPara(v: Vista) {
    setVista(v)
    try {
      sessionStorage.setItem(VISTA, v)
    } catch {
      /* segue na memória */
    }
    // troca de tela começa do topo, como em app nativo
    window.scrollTo({ top: 0 })
  }

  function conteudo() {
    switch (vista) {
      case 'inicio':
        return <Inicio usuario={usuario} aoVerHorarios={() => irPara('horarios')} />
      case 'horarios':
        return <Horarios />
      case 'presets':
        return <Presets />
      case 'historico':
        return <Historico />
      case 'ajustes':
        return <Ajustes usuario={usuario} tema={tema} aoMudarTema={aoMudarTema} aoSair={() => void sair()} />
    }
  }

  return (
    <div className="min-h-[100dvh] bg-fundo text-texto">
      <Sidebar usuario={usuario} vista={vista} aoIr={irPara} aoSair={() => void sair()} />
      <TopBar />

      <main className="pb-[calc(theme(spacing.nav)+env(safe-area-inset-bottom)+1.5rem)] lg:pb-10 lg:pl-sidebar">
        <div className="mx-auto max-w-5xl px-4 pt-5 sm:px-6 lg:pt-8">
          {/* key = vista: trocar de tela REMONTA, e a remontagem toca a entrada */}
          <div key={vista} className="animate-subir">
            {conteudo()}
          </div>
        </div>
      </main>

      <NavInferior vista={vista} aoIr={irPara} />
    </div>
  )
}

/** Tela cheia centrada: carregamento inicial antes do shell existir. */
function Tela() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-fundo px-8 text-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-acento border-r-transparent" aria-label="carregando" />
    </div>
  )
}
