import { useEffect, useState } from 'react'
import { api, aoMudarSessao, ErroApi, type Usuario } from '@/lib/api'

// O cookie de sessão é HttpOnly: o JS não sabe se está logado sem perguntar à API.
// A última identidade conhecida fica em cache para o app abrir direto no shell
// (sem piscar o login). Ela não dá acesso a nada: quem decide é o cookie.
const CACHE = 'casa:usuario'

function lerCache(): Usuario | null {
  try {
    const cru = localStorage.getItem(CACHE)
    return cru ? (JSON.parse(cru) as Usuario) : null
  } catch {
    return null
  }
}

function gravarCache(u: Usuario | null): void {
  try {
    if (u) localStorage.setItem(CACHE, JSON.stringify(u))
    else localStorage.removeItem(CACHE)
  } catch {
    /* sem storage: só não abre direto */
  }
}

export function useSessao() {
  const [sessao, setSessao] = useState<Usuario | null>(lerCache)
  const [carregando, setCarregando] = useState(() => lerCache() === null)

  useEffect(() => {
    let vivo = true
    const definir = (u: Usuario | null) => {
      gravarCache(u)
      if (vivo) setSessao(u)
    }

    api
      .get<{ usuario: Usuario }>('/auth/eu')
      .then((r) => definir(r.usuario))
      .catch((e) => {
        // Só 401 é "sem sessão". Sem rede, fica o cache.
        if (e instanceof ErroApi && e.status === 401) definir(null)
      })
      .finally(() => vivo && setCarregando(false))

    const parar = aoMudarSessao(definir)
    return () => {
      vivo = false
      parar()
    }
  }, [])

  return { sessao, carregando }
}
