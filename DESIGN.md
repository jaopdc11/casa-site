# DESIGN — regras para as telas

Mesmo sistema de design do Orçamento (`web/orcamento`), adaptado para a casa.
Se algo não está aqui nem em `src/design/`, não invente um padrão novo na sua
tela: use o mais próximo que existe.

Identidade: **escuro sóbrio**. Escuro é o tema principal; o claro é derivado dos
mesmos papéis. Nada de confete, glow, gradiente decorativo, fundo de aurora/blob.
A graça vem de tipografia, espaçamento e movimento curto. Cara de app nativo:
nav inferior no celular, sidebar no desktop, folhas (Sheet) por cima.

---

## 0. Regras duras

1. **Importe só de `@/design`** (que também reexporta `Icone`).
2. **Nunca cor literal de interface** nas telas: nada de `gray-500`, `#fff`,
   `dark:...`, `bg-white`. Só os tokens de papel abaixo. O tema troca sozinho.
   **Exceção:** a cor da LUZ é dado (o que a lâmpada mostra) e entra por
   `style` a partir de `lib/cores.ts` (`corVisivel`, `corDoVisual`,
   `corDoBranco`, `PALETA`, `TRILHO_TEMPERATURA`).
3. **Brilho, horas, datas curtas e contagens em `font-mono`.**
4. **Todo comando para a luz passa por `useComandoLuz`** (otimista, rollback e
   toast "A luz não respondeu" no 502). Nunca chame `comandar()` da query direto
   numa tela.
5. Estado da casa vem de `useCasa()` (`lib/casa.tsx`). Tela não busca lista por
   conta própria; usa `recarregar('horarios')` etc. e deixa o SSE manter fresco.
6. Checagens antes de entregar: `pnpm typecheck && pnpm build`.

## 1. Tokens (cores por papel)

Classes Tailwind (`bg-X`, `text-X`, `border-X`, aceitam `/opacidade`):

| Papel | Uso |
|---|---|
| `fundo` | fundo da página (o shell já pinta) |
| `superficie` | cartão, sheet, lista |
| `superficie-alta` | pressionado, trilho, chip neutro, hover |
| `campo` | input, select, segmented (um degrau ABAIXO do cartão) |
| `borda` / `borda-forte` | fio de cartão e divisória / hover e destaque |
| `texto` / `suave` / `tenue` | principal / secundário / rótulo e legenda |
| `acento` / `acento-suave` / `sobre-acento` | teal: ação primária, ligado, ativo / hover / texto sobre o acento |
| `sucesso` | online, executado |
| `atencao` | pausado, reconectando, aviso |
| `perigo` | destrutivo, falha, offline |
| `tinta-acento`, `tinta-sucesso`, `tinta-atencao`, `tinta-perigo` | fundo tintado do estado, em par com `text-<estado>` |

Outros: `rounded-card` (14px), `rounded-sheet` (20px), `shadow-card`,
`shadow-flutuante`, `ease-suave`, espaçamentos `h-nav`, `h-topo`, `w-sidebar`.

## 2. Tipografia

- `font-display` (Space Grotesk): títulos de tela, de seção e nome de cartão grande.
- `font-sans` (Inter, padrão): todo o resto.
- `font-mono` (JetBrains Mono): brilho (`60%`), horas (`18:00`), datas curtas, contagens.
- Escala: título de tela `text-2xl`; seção `text-base font-semibold`; corpo `text-sm`; legenda `text-xs`; selo 10px uppercase (`<Selo/>`).
- Número herói: o brilho no cartão da luz (`font-mono text-4xl`) — **um por tela**.

## 3. Espaçamento e layout

- O shell já dá o gutter (`px-4`, `sm:px-6`), largura máx. (`max-w-5xl`), topo e
  o espaço da nav inferior. A tela começa direto no `CabecalhoTela`.
- Entre blocos: `space-y-3` (relacionados) / `space-y-6` (seções).
- Grade de cartões: `grid grid-cols-2 gap-3`, `lg:grid-cols-3`.
- Mobile-first (≈380px), só então `sm:`/`lg:`. Alvos de toque ≥ 44px (`min-h-11`).

## 4. Componentes (`@/design`)

| Componente | Quando usar |
|---|---|
| `CabecalhoTela` | topo de TODA tela: `selo`, `titulo`, `descricao`, `acao` |
| `Selo` / `TituloSecao` | microrrótulo uppercase / cabeçalho de seção |
| `Cartao` | bloco com borda fina; `aoTocar` vira botão; `semPadding` para borda a borda |
| `Botao` / `BotaoIcone` | `primario` (1 por contexto), `secundario`, `fantasma`, `perigo` / ação só de ícone (44×44, `rotulo` obrigatório) |
| `Campo` / `Select` / `Textarea` / `Rotulo` | formulário |
| `Chip` / `FileiraChips` | seleção tocável (preset, atalho de dias) / fileira que rola na horizontal |
| `Badge` | etiqueta NÃO tocável: `neutro`, `acento`, `sucesso`, `atencao`, `perigo` |
| `Tabs` | segmented de 2–4 opções (`cheio`; `tom="neutro"` quando não é ação) |
| `Interruptor` | chave liga/desliga que vale na hora (horário ativo, "definir brilho") |
| `Deslizador` | range que **só envia ao soltar** (`aoSoltar`), com `aoMover` para o número ao vivo; `trilho="preenchido"` ou um CSS background |
| `Sheet` | todo formulário/detalhe/confirmação por cima; `rodape` para os botões |
| `useToast().mostrar(txt, {tom})` | confirmação depois de salvar/excluir; erro de comando |
| `vibrar(...)` | `leve` ao comandar, `sucesso` ao salvar, `aviso` ao excluir, `erro` na falha |
| `Vazio` / `Aviso` | estado vazio com UMA frase boa + ação / faixa de erro com `aoTentarDeNovo` |
| `Lista` / `LinhaLista` | lista padrão em cartão |
| `Esqueleto` / `EsqueletoLista` | carregando: forma do conteúdo, não spinner |
| `CaixasCodigo` | código de 6 dígitos do login |
| `Avatar` | iniciais da conta |

Da feature `luz` (reaproveitáveis): `PaletaCores` (amostras + seletor nativo),
`SeletorVisual` (branco/cor, opcionalmente "manter"), `BrilhoOpcional`.

## 5. Padrões

- Toque na linha = abrir/editar num `Sheet`. Ações extras sempre visíveis
  (proibido `opacity-0 group-hover:`).
- Excluir: confirmação dentro de um Sheet (botão `perigo`), nunca `confirm()`.
  Depois: `vibrar('aviso')` + toast.
- Toda tela que busca dados tem carregando (esqueleto), erro (`Aviso`) e vazio (`Vazio`).
- Texto de interface formal e cuidadoso, sem gíria.

## 6. Movimento

Easing único `ease-suave` = `cubic-bezier(.16,1,.3,1)`.
- Troca de tela: o shell remonta por `key` e toca `animate-subir`.
- Listas na primeira carga: `cascata` no contêiner.
- Elemento que nasce: `animate-pop`; caixa: `animate-scale-in`; troca de painel: `animate-fade`.
- Tocáveis: `active:scale-[0.97]` (os componentes já têm).
- `prefers-reduced-motion` desliga tudo no CSS.

## 7. Shell

- Celular: `TopBar` sticky (marca + indicador "Ao vivo") + `NavInferior`
  (Início · Horários · Presets · Histórico · Ajustes).
- Desktop (lg+): `Sidebar` com as mesmas vistas, conta e sair.
- Toast global: `ProvedorToast` no App. Estado da casa: `ProvedorCasa` (só logado).
