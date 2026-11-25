// Cliente da API da casa (casa.api.jaopd.dev).
//
// A sessão é um cookie HttpOnly que o JS nem enxerga: `credentials: 'include'`
// faz o navegador mandar. Front e API são same-site (*.jaopd.dev), então o
// SameSite=Lax do cookie não atrapalha. Escrita sempre leva corpo JSON: com
// cookie, a API exige application/json (CSRF).

const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {}
export const API_URL = (env.VITE_API_URL ?? 'https://casa.api.jaopd.dev').replace(/\/$/, '')

export type Usuario = { email: string; nome: string | null }

// --- sessão: quem quiser saber de login/logout escuta aqui ------------------

type Ouvinte = (u: Usuario | null) => void
const ouvintes = new Set<Ouvinte>()

export function aoMudarSessao(fn: Ouvinte): () => void {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

export function avisarSessao(u: Usuario | null): void {
  ouvintes.forEach((fn) => fn(u))
}

// --- requisição --------------------------------------------------------------

export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function requisitar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(API_URL + caminho, {
      method: metodo,
      credentials: 'include',
      headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    // status 0 = nem chegou na API (sem rede, DNS, CORS)
    throw new ErroApi('Sem conexão com a casa. Verifique a internet.', 0)
  }

  // Envelope da API: { status: 'success', data } | { status: 'error', detail }
  const texto = await resposta.text()
  let envelope: { status: 'success'; data: T } | { status: 'error'; detail: unknown } | null = null
  try {
    envelope = texto ? JSON.parse(texto) : null
  } catch {
    envelope = null
  }

  if (!resposta.ok || envelope?.status !== 'success') {
    // Sessão morreu no meio do uso (expirou, saiu em outro aparelho): volta para o login.
    // /auth/eu fica de fora porque é ele que descobre se tem sessão.
    if (resposta.status === 401 && caminho !== '/auth/eu') avisarSessao(null)
    throw new ErroApi(mensagemDeErro(envelope, resposta.status), resposta.status)
  }
  return envelope.data
}

// O FastAPI devolve detail como texto ou como lista de erros de validação.
function mensagemDeErro(envelope: unknown, status: number): string {
  const detalhe = (envelope as { detail?: unknown } | null)?.detail
  if (typeof detalhe === 'string' && detalhe) return detalhe
  if (Array.isArray(detalhe) && detalhe.length > 0) {
    const msg = (detalhe[0] as { msg?: string }).msg
    if (msg) return msg.replace(/^Value error, /, '')
  }
  if (status === 429) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
  return `Erro ${status}`
}

export const api = {
  get: <T>(caminho: string) => requisitar<T>('GET', caminho),
  post: <T>(caminho: string, corpo: unknown = {}) => requisitar<T>('POST', caminho, corpo),
  patch: <T>(caminho: string, corpo: unknown) => requisitar<T>('PATCH', caminho, corpo),
  // DELETE também leva corpo JSON vazio: é escrita, e a API confere o content-type
  del: <T>(caminho: string) => requisitar<T>('DELETE', caminho, {}),
}

export async function sair(): Promise<void> {
  try {
    await api.post('/auth/sair')
  } finally {
    avisarSessao(null)
  }
}
