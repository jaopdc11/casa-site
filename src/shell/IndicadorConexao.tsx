import { useEffect, useState } from 'react'
import { cx } from '@/design'
import { ouvirConexao, type Conexao } from '@/lib/eventos'

const TEXTO: Record<Conexao, string> = { 'ao-vivo': 'Ao vivo', conectando: 'Conectando', reconectando: 'Reconectando' }

/** Pílula discreta: as mudanças estão chegando em tempo real ou não. */
export function IndicadorConexao({ className }: { className?: string }) {
  const [c, setC] = useState<Conexao>('conectando')
  useEffect(() => ouvirConexao(setC), [])
  return (
    <span
      role="status"
      title={c === 'ao-vivo' ? 'Recebendo mudanças em tempo real' : 'Sem tempo real no momento; os dados são atualizados ao voltar para o app'}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border border-borda px-2.5 py-1 text-[11px] font-medium',
        c === 'ao-vivo' ? 'text-suave' : 'text-atencao',
        className,
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', c === 'ao-vivo' ? 'bg-sucesso' : 'animate-pulse bg-atencao')} />
      {TEXTO[c]}
    </span>
  )
}
