import { useEffect, useState } from 'react'
import { Aviso, Badge, Cartao, Chip, Deslizador, FileiraChips, Icone, Selo, Tabs, cx } from '@/design'
import { TRILHO_TEMPERATURA, corDoVisual, corParecida, corVisivel, descreverEstado } from '@/lib/cores'
import type { Aparelho, Preset } from '@/lib/tipos'
import { PaletaCores } from './PaletaCores'
import { useComandoLuz } from './useComandoLuz'

type Modo = 'branco' | 'cor'

/**
 * Cartão de controle de uma luz: liga/desliga grande, brilho, modo branco
 * (quente↔frio) ou cor, e os presets em fileira. Tudo otimista.
 */
export function CartaoLuz({ aparelho, presets }: { aparelho: Aparelho; presets: Preset[] }) {
  const { comandar, aplicarPreset } = useComandoLuz()
  const e = aparelho.estado
  const ligado = !!e?.ligado
  const offline = e?.online === false
  const brilho = e?.brilho ?? 100
  const temperatura = e?.temperatura ?? 50
  const amostra = corVisivel(e)

  // A aba segue o modo da lâmpada, mas a pessoa pode trocar antes de escolher.
  const modoDaLuz: Modo = e?.modo === 'colour' ? 'cor' : 'branco'
  const [modo, setModo] = useState<Modo>(modoDaLuz)
  useEffect(() => setModo(modoDaLuz), [modoDaLuz])

  const [brilhoAoVivo, setBrilhoAoVivo] = useState<number | null>(null)
  const brilhoMostrado = brilhoAoVivo ?? brilho

  function trocarModo(m: Modo) {
    setModo(m)
    // trocar a aba já muda a luz: é o que um app de lâmpada faz
    if (m === modoDaLuz && ligado) return
    if (m === 'branco') void comandar(aparelho, { temperatura })
    else void comandar(aparelho, { cor: e?.cor ?? '#ff6600' })
  }

  return (
    <Cartao semPadding className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={cx(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-card transition-colors duration-300 ease-suave',
              !amostra && 'bg-superficie-alta text-tenue',
            )}
            style={amostra ? { backgroundColor: `${amostra}2e`, color: amostra } : undefined}
          >
            <Icone n="lampada" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-semibold text-texto">{aparelho.nome}</h2>
            <p className="mt-0.5 truncate text-sm text-suave">{descreverEstado(e)}</p>
          </div>
          {e === null ? (
            <Badge>Sem leitura</Badge>
          ) : offline ? (
            <Badge tom="perigo">
              <Icone n="wifiOff" className="h-3 w-3" />
              Offline
            </Badge>
          ) : (
            <Badge tom="sucesso">
              <span className="h-1.5 w-1.5 rounded-full bg-sucesso" />
              Online
            </Badge>
          )}
        </div>

        <div className="mt-6 flex items-center gap-5">
          <button
            type="button"
            role="switch"
            aria-checked={ligado}
            aria-label={ligado ? 'Apagar a luz' : 'Acender a luz'}
            onClick={() => void comandar(aparelho, { ligado: !ligado })}
            className={cx(
              'flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border transition-[transform,background-color,border-color,color] duration-200 ease-suave active:scale-[0.92]',
              ligado ? 'border-acento bg-acento text-sobre-acento shadow-card' : 'border-borda bg-superficie-alta text-suave hover:text-texto',
            )}
          >
            <Icone n="power" className="h-8 w-8" />
          </button>
          <div className="min-w-0">
            <Selo className="mb-2">{ligado ? 'Brilho' : 'Desligada'}</Selo>
            <p className={cx('font-mono text-4xl font-semibold leading-none tracking-tight', ligado ? 'text-texto' : 'text-tenue')}>
              {ligado ? brilhoMostrado : '—'}
              {ligado && <span className="ml-0.5 text-xl text-suave">%</span>}
            </p>
          </div>
        </div>

        {offline && (
          <Aviso tom="atencao" className="mt-5">
            A lâmpada não está respondendo. Verifique se o interruptor da parede está ligado.
          </Aviso>
        )}
      </div>

      <div className={cx('space-y-5 border-t border-borda p-5 transition-opacity duration-200', !ligado && 'opacity-60')}>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-suave">Brilho</span>
            <span className="font-mono text-xs text-tenue">{brilhoMostrado}%</span>
          </div>
          <Deslizador
            rotulo="Brilho"
            min={1}
            max={100}
            valor={brilho}
            aoMover={setBrilhoAoVivo}
            aoSoltar={(v) => {
              setBrilhoAoVivo(null)
              void comandar(aparelho, { brilho: v })
            }}
          />
        </div>

        <Tabs<Modo>
          cheio
          ativa={modo}
          aoTrocar={trocarModo}
          abas={[
            { id: 'branco', rotulo: <><Icone n="sun" className="h-4 w-4" />Branco</> },
            { id: 'cor', rotulo: <><Icone n="palette" className="h-4 w-4" />Cor</> },
          ]}
        />

        {modo === 'branco' ? (
          <div key="branco" className="animate-fade">
            <Deslizador
              rotulo="Temperatura do branco"
              valor={temperatura}
              trilho={TRILHO_TEMPERATURA}
              aoSoltar={(v) => void comandar(aparelho, { temperatura: v })}
            />
            <div className="mt-0.5 flex justify-between text-xs text-tenue">
              <span>Quente</span>
              <span>Neutro</span>
              <span>Frio</span>
            </div>
          </div>
        ) : (
          <div key="cor" className="animate-fade pt-1">
            <PaletaCores valor={e?.modo === 'colour' ? e.cor : null} aoEscolher={(hex) => void comandar(aparelho, { cor: hex })} />
          </div>
        )}
      </div>

      {presets.length > 0 && (
        <div className="border-t border-borda px-5 pb-4 pt-4">
          <Selo className="mb-3">Presets</Selo>
          <FileiraChips className="-mx-5 px-5">
            {presets.map((p) => {
              const cor = corDoVisual(p)
              const ativo =
                ligado &&
                (p.cor ? e?.modo === 'colour' && corParecida(p.cor, e.cor) : e?.modo === 'white' && e.temperatura === p.temperatura) &&
                (!p.brilho || p.brilho === e?.brilho)
              return (
                <Chip
                  key={p.id}
                  ativo={!!ativo}
                  aoTocar={() => void aplicarPreset(aparelho, p)}
                  icone={<span className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/15" style={{ backgroundColor: cor ?? undefined }} />}
                >
                  {p.nome}
                </Chip>
              )
            })}
          </FileiraChips>
        </div>
      )}
    </Cartao>
  )
}
