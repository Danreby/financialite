---
name: Financialite
description: Painel financeiro escuro e premium, grafite com brilho suave e um destaque quente que acende só o que importa.
colors:
  primary: "#D2430E"
  primary-hover: "#B83A0B"
  primary-soft: "#2E2926"
  primary-text: "#FF6B35"
  chart-ember: "#F2541B"
  on-primary: "#FFFFFF"
  ground: "#0B0B0C"
  card-graphite: "#161618"
  well-graphite: "#101012"
  hairline: "#29292A"
  hairline-strong: "#373738"
  ink: "#F4F4F5"
  ink-secondary: "#D4D4D8"
  ink-muted: "#9A9AA0"
  ink-subtle: "#6B6B72"
  success: "#22C55E"
  success-strong: "#4ADE80"
  success-soft: "#182F22"
  danger: "#EF4444"
  danger-strong: "#F87171"
  danger-soft: "#341C1E"
  warning: "#F59E0B"
  warning-strong: "#FBBF24"
  warning-soft: "#352916"
  info: "#3B82F6"
  info-strong: "#60A5FA"
  info-soft: "#1B2537"
  light-ground: "#F4F4F5"
  light-card: "#FFFFFF"
  light-well: "#EFEFF1"
  light-hairline: "#E4E4E7"
  light-ink: "#18181B"
  light-ink-muted: "#52525B"
  light-primary: "#C2410C"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    fontFeature: "tnum"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
rounded:
  card: "16px"
  chip: "10px"
  alert: "12px"
  segment: "8px"
  pill: "9999px"
spacing:
  card-sm: "16px"
  card-md: "20px"
  gap: "16px"
  gap-xl: "20px"
  sidebar-inset: "12px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.chip}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.well-graphite}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    height: "40px"
    padding: "0 16px"
  button-ghost:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.chip}"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-strong}"
    rounded: "{rounded.chip}"
    height: "40px"
  card:
    backgroundColor: "{colors.card-graphite}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  stat-card:
    backgroundColor: "{colors.card-graphite}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  icon-chip:
    backgroundColor: "{colors.well-graphite}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    size: "36px"
  input:
    backgroundColor: "{colors.well-graphite}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    height: "40px"
    padding: "0 12px"
  pill-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-strong}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  pill-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning-strong}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  pill-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-strong}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  pill-accent:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  alert-item:
    backgroundColor: "{colors.well-graphite}"
    textColor: "{colors.ink}"
    rounded: "{rounded.alert}"
    padding: "14px"
  segmented-control:
    backgroundColor: "{colors.well-graphite}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.chip}"
    padding: "4px"
  nav-item-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.segment}"
    padding: "6px 12px"
---

# Design System: Financialite

Registro do que foi construído na branch `fase-2-design`, lido do CSS, do Tailwind e dos componentes. Só o Dashboard e o shell (menu, topo, barra do celular) seguem este sistema por inteiro; veja as lacunas ao final. Os valores acima são os do modo escuro com a paleta Brasa. As cores reais vêm de variáveis CSS (`resources/css/app.css`) e a paleta do usuário sobrescreve o grupo do destaque.

## Overview

**Creative North Star: "O Painel de Brasa"**

Um painel de leitura calma em grafite, com uma única brasa acesa. O fundo é quase preto com um brilho suave no topo; os cards são grafite com realce interno e borda branca translúcida; o destaque (laranja-brasa por padrão) aparece só onde a ação ou o estado ativo precisa de atenção: botão principal, item ativo do menu, linha principal do gráfico, contador de pendências. A direção foi fixada pelo dono do produto com a imagem `docs/design/referencia-dashboard.png`, depois de recusar quatro rodadas. Referência de acabamento citada no produto: apps web do Nubank e do Inter.

A densidade é média. Números grandes em 600 com algarismos tabulares, rótulos em cinza, ícones de traço fino dentro de chips escuros. Nada compete com o valor: uma pessoa revisando a fatura deve ler o número, a variação e o estado em segundos. Estados como vencido, pago e alerta nunca dependem só de cor: sempre há texto ou seta junto.

O escuro é o modo padrão; o claro é a contraparte com o mesmo papel para cada token (fundo cinza-claro, cards brancos, sem realce interno). O usuário escolhe uma entre 7 paletas, e a escolha personaliza o destaque sem nunca disfarçar um alerta.

**Key Characteristics:**
- Fundo `#0B0B0C` com brilho radial no topo; cards grafite `#161618` com borda branca a 7% e realce de topo a 4%.
- Raio 16 px nos cards, 10 px em controles e chips, pílula completa nos selos.
- Uma cor de destaque por vez, vinda da paleta do usuário; cores semânticas fixas e independentes dela.
- Inter em toda a interface, com `tabular-nums` aplicado ao corpo inteiro.
- Profundidade tonal (camadas de grafite e linha fina), com sombra suave só em cards e flutuantes.
- Movimento curto (150 a 200 ms), desligado com `prefers-reduced-motion`.

## Colors

Neutros grafite quase puros, um destaque quente trocável, e quatro cores semânticas fixas. Cada papel tem um valor no escuro e outro no claro, e o código só usa o papel, nunca o valor.

### Primary
- **Brasa** (`#D2430E` escuro, `#C2410C` claro): fundo do botão principal, trilho do switch ligado, avatar, preenchimento da barra de progresso em estado normal. Texto branco por cima passa de 4,5:1 nos dois modos (4,62:1 no escuro).
- **Brasa Hover** (`#B83A0B` escuro, `#9A3412` claro): hover do botão principal.
- **Brasa Névoa** (`#2E2926` escuro, `#FAF4F0` claro): neutro puxado para o laranja; fundo do item ativo do menu e da pílula de destaque. Fica longe dos fundos suaves de perigo e aviso de propósito.
- **Brasa Texto** (`#FF6B35` escuro, `#C2410C` claro): o destaque quando é texto ou ícone (6,37:1 no card escuro). Também é a cor do anel de foco no escuro.
- **Brasa Viva** (`#F2541B`): `--chart-1`, a linha principal dos gráficos. É tom de linha, não de texto (3,47:1 sobre branco).

### Secondary
- **Rosa Companheira** (`--chart-2`, `#F472B6` escuro, `#DB2777` claro): segunda série dos gráficos.
- **Cinza Série** (`--chart-3`, `#A1A1AA` escuro, `#71717A` claro): terceira série e séries tracejadas.
- Categorias (pizza e barras): `--chart-4` azul, `--chart-5` verde-azulado, `--chart-6` violeta.

### Neutral
- **Fundo** (`#0B0B0C`; claro `#F4F4F5`): página.
- **Card Grafite** (`#161618`; claro `#FFFFFF`): cards, menu lateral, topo, toasts.
- **Poço** (`#101012`; claro `#EFEFF1`): campos, trilhas, segmentos, cards de alerta e chips, sempre um degrau abaixo do card.
- **Fio** (`#29292A`; claro `#E4E4E7`) e **Fio Forte** (`#373738`; claro `#D4D4D8`): divisórias, bordas de campos, rolagem. No escuro são o branco a 8% e 14% já resolvidos sobre o card.
- **Tinta** (`#F4F4F5`; claro `#18181B`), **Tinta Secundária** (`#D4D4D8`; `#3F3F46`), **Tinta Apagada** (`#9A9AA0`; `#52525B`, rótulos e legendas, 6,46:1 no card escuro) e **Tinta Sutil** (`#6B6B72`; `#A1A1AA`, só decorativo e desabilitado, nunca texto que a pessoa precisa ler).

### Semantic
Cada tom tem três valores: sólido (barras, ícones), forte (texto) e suave (fundo da pílula).
- **Sucesso** `#22C55E` / forte `#4ADE80` / suave `#182F22`: alta, receita, pago, dentro do orçamento.
- **Perigo** `#EF4444` / forte `#F87171` / suave `#341C1E`: queda, estouro, vencido, prioridade Alta.
- **Aviso** `#F59E0B` / forte `#FBBF24` / suave `#352916`: perto do limite, prioridade Média.
- **Info** `#3B82F6` / forte `#60A5FA` / suave `#1B2537`: informativo neutro.

### Paletas do usuário
Sete paletas em `resources/js/Constants/palettes.json`: **Brasa** (padrão), Rosé, Floresta, Ouro, Lavanda, Meia-noite, Preto. Cada uma traz cinco valores por modo (`accent`, `accentHover`, `accentSoft`, `accentText`, e `chart` opcional). O `ThemeContext` escreve só o grupo `--accent*` e `--chart-1` no `<html>`, já resolvido para o modo atual. Superfícies, texto, linhas e cores semânticas não mudam com a paleta.

### Named Rules
**The Palette Never Disguises Rule.** A paleta troca o destaque, mas jamais toma o lugar de uma cor de estado. Alerta é sempre perigo ou aviso, mesmo na paleta Rosé (vermelho-rosado) ou Brasa (laranja): por isso a pílula de destaque (`pill-accent`) tem contorno de 1 px que as pílulas de estado não têm, o `accent-soft` é um neutro levemente tingido, longe do `danger-soft` e do `warning-soft`, e o texto da pílula sempre diz o estado.

**The One Ember Rule.** O destaque acende ação, estado ativo e a série principal. Um card, um botão principal e um item ativo por área; o resto fica em grafite.

**The Text Is Not The Fill Rule.** Destaque como fundo usa `accent`; destaque como texto ou ícone usa `accent-text`. O Tailwind já mapeia `text-theme-accent` para `accent-text`. Nunca use `accent` puro como texto no escuro.

**The Tinted Not Solid Rule.** Perigo em botão é tonal (fundo suave, texto forte, borda a 40%), porque vermelho sólido com texto branco não passa de 4,5:1 no escuro.

## Typography

**Display, Body e Label Font:** Inter (pesos 400, 500, 600, 700, carregada por `fonts.bunny.net`), com `ui-sans-serif` e a pilha padrão do Tailwind como reserva.

**Character:** Uma família só, hierarquia por peso e tamanho. Números sempre tabulares: `font-variant-numeric: tabular-nums` está no `body`, então colunas de valores alinham sem classe extra.

### Hierarchy
- **Display** (600, 1.625rem, 2rem, tracking -0.025em): valor do indicador (KPI) no `StatCard`.
- **Headline** (600, 1.5rem, 2rem, tracking -0.025em): título da página (`PageHeader`, um `h1` por tela).
- **Title** (600, 0.9375rem, 1.5rem): título de card.
- **Body** (400 a 500, 0.875rem, 1.25rem): texto, linhas de tabela, campos. Textos corridos em `max-w-prose`.
- **Label** (500, 0.75rem a 0.8125rem): rótulos de campo, cabeçalho de tabela, legendas e variações (`text-xs`), em Tinta Apagada. Pílulas usam 0.6875rem em 600.

### Named Rules
**The Tabular Always Rule.** Todo valor em reais usa `MoneyText` ou `tabular-nums`. Gasto comum é neutro (sinal `−`, tom neutro); só receita é verde e só estouro é vermelho.

**The Muted Labels Rule.** Rótulo fica em cinza apagado; o número fica em Tinta. A hierarquia vem do contraste de tom e do peso, não de caixa alta nem de espaçamento largo.

## Layout

Menu lateral em painel flutuante, fixo a 12 px das bordas (`left-3 top-3 bottom-3`), com 248 px aberto e 76 px recolhido. O conteúdo recebe a margem esquerda pela variável `--sidebar-offset`, animada em 200 ms. A área de conteúdo rola por dentro, com `px-3 sm:px-4 md:pl-5 md:pr-6`, e o Dashboard se centraliza em `max-w-[1600px]`.

O Dashboard é uma grade de 12 colunas a partir de `xl` (1280 px), com `gap-4` e `xl:gap-5` (16 e 20 px). Ordem: cabeçalho da página com seletor de cartão e botão principal, linha de KPIs, gráfico de gastos (8 colunas) ao lado da coluna de alertas (4 colunas) e atividade recente abaixo do gráfico, previsão (7) com ações rápidas (5), e uma linha de três cards (maiores gastos, orçamentos, próximas contas), depois saúde financeira e tendências. Abaixo de `xl` tudo empilha ou vira duas colunas em `lg`.

Respiro interno do card: 16 px em indicadores (`p-4`), 20 px nos demais (`p-5`). Cabeçalho do card separado do corpo por 16 px. Breakpoints do Tailwind padrão (`sm` 640, `md` 768, `lg` 1024, `xl` 1280); `md` é o ponto em que o menu lateral aparece.

No celular (abaixo de `md`) o menu vira um overlay aberto pelo botão do topo, o topo mostra o nome da página no lugar da busca e uma barra inferior flutuante (`surface-panel`, 8 px das bordas, respeita a área segura do aparelho) traz Início, Transações, Fatura e o atalho Nova despesa. O conteúdo reserva `pb-24` para a barra.

## Elevation & Depth

Híbrido, com predominância tonal. A profundidade vem de camadas de grafite (fundo, card, poço) e de uma linha de 1 px; a sombra é sutil e só acompanha cards e elementos flutuantes. No escuro, um realce interno de 1 px no topo e um gradiente branco a 4% dão o relevo de "vidro fosco" dos cards; no claro, esse realce não existe e a sombra é quase nula.

### Shadow Vocabulary
- **Card** (`--shadow-card`; escuro `0 1px 0 rgb(255 255 255 / 0.04) inset, 0 8px 24px rgb(0 0 0 / 0.35)`; claro `0 1px 2px rgb(24 24 27 / 0.04), 0 4px 12px rgb(24 24 27 / 0.04)`): cards e painel do menu.
- **Pop** (`--shadow-pop`; escuro `0 1px 0 rgb(255 255 255 / 0.05) inset, 0 16px 40px -8px rgb(0 0 0 / 0.55)`; claro `0 12px 32px -8px rgb(24 24 27 / 0.14), 0 2px 6px -2px rgb(24 24 27 / 0.06)`): tooltip do gráfico, dicas flutuantes do menu recolhido, toasts, menu do usuário.
- **Botão principal** (`0 1px 0 rgb(255 255 255 / 0.12) inset, 0 6px 14px -6px rgb(var(--accent) / 0.6)`): sombra tingida pela paleta, com deslocamento para baixo e raio negativo, nunca um halo difuso.
- **Realce do card** (`--card-highlight`, `linear-gradient(180deg, rgb(255 255 255 / 0.04), transparent)`): só no escuro.
- **Brilho do fundo** (`--ground-glow`, elipse radial branca a 6% no topo no escuro, a 90% no claro): aplicado ao `body` e a `.surface-ground`.

### Named Rules
**The Tonal First Rule.** Para separar áreas, use um degrau de superfície (card sobre fundo, poço dentro do card) e uma linha de 1 px antes de pensar em sombra.

**The Soft Lift Rule.** Sombras são difusas e escuras, com um filete interno de luz no topo no escuro. Nenhuma sombra dura com deslocamento sem desfoque.

## Shapes

Cantos arredondados generosos, em três degraus: **16 px** (`rounded-card`) nos cards e no menu, **10 px** (`rounded-chip`) em botões, campos, chips de ícone, segmentos e tooltips, **12 px** nos cards de alerta internos, e **pílula** (9999 px) em selos, barras de progresso e avatar. O `sm` dos botões e campos usa 10 px literal (altura 32 px). Controles dentro de um card ficam um degrau abaixo do raio do card.

Bordas são sempre de 1 px: branca translúcida a 7% nos cards escuros (`--card-border`), `--line` no claro. Campos usam `--line` com hover em `--line-strong`. Ícones são do `lucide-react` em traço de 1,75 px, 18 px nos itens do menu e do chip, dentro de quadrados arredondados escuros (`icon-chip`, 36 px). Ícone nunca é glifo de texto nem emoji.

## Components

O kit vive em `resources/js/Components/ui/` (export único em `index.js`). Use o kit; as classes `themed-*` são legado.

### Buttons
- **Shape:** 10 px (md, altura 40 px, `px-4`, texto `text-sm` 600) ou 10 px (sm, altura 32 px, `px-3`, `text-xs`). Versão só-ícone é quadrada e exige `aria-label`.
- **Primary:** fundo da paleta, texto branco, sombra tingida. Um por área; é a ação principal da tela ("Nova despesa").
- **Secondary:** poço com linha de 1 px, para ações de apoio.
- **Ghost:** sem fundo, para ações de baixa ênfase e botões de ícone do topo.
- **Danger:** tonal (fundo suave, texto forte, borda a 40%), para excluir e confirmar destruição.
- **Hover / Focus / Loading:** transição de 150 ms em cor, borda e sombra; `active` desce 1 px; `loading` troca o ícone pelo spinner, desabilita e marca `aria-busy`; desabilitado a 50%.

### Cards / Containers
- **Card** (`Card`, `.surface-card`): grafite, realce de topo, borda translúcida, raio 16 px, `shadow-card`. Cabeçalho opcional com título (15 px, 600), subtítulo apagado e ações à direita. Padding `sm` 16 px, `md` 20 px.
- **Painel** (`.surface-panel`): mesmo visual do card, para menu lateral e barra inferior do celular.
- **StatCard** (indicador): chip de ícone + rótulo, valor grande (display), linha de variação com seta, texto e legenda ("vs mês anterior"). Para gasto, subir é ruim: use `tone="negative"` com `trend="up"`. Tem estado de carregamento com `Skeleton`.
- **AlertItem:** cartão interno em poço (raio 12 px) com título, `PriorityBadge`, descrição e linha de detalhe com ícone no tom da prioridade.

### Chips and Badges
- **Icon chip:** 36 px, poço, borda translúcida, ícone de 18 px na tinta primária.
- **Badge / pílula** (`Badge`, `.pill`): 11 px, 600. Tons neutral, accent, success, warning, danger, info. O texto sempre diz o estado. `PriorityBadge` mapeia Alta para danger, Média para warning, Baixa para success, com "Prioridade" só para leitor de tela.
- **Contador de pendências:** pílula de destaque com o número no item do menu; recolhido, vira um ponto de 8 px na cor da paleta.

### Inputs / Fields
- **Style:** poço com linha de 1 px, raio 10 px, altura 40 px (32 px em `sm`), placeholder em Tinta Apagada. Componentes: `Input`, `Select`, `SearchInput`, `MoneyInput`, `Field` (rótulo visível obrigatório), `Switch`, `SegmentedControl`.
- **Focus:** borda na cor da paleta mais anel de 3 px a 25%; hover sobe a linha para `--line-strong`.
- **Error / Disabled:** `aria-invalid` pinta borda e anel de perigo; desabilitado a 60%.
- **SegmentedControl:** `radiogroup` em poço; opção marcada sobe para o card com anel de 1 px; setas, Home e End navegam.
- **Switch:** `role="switch"`, trilho 44 × 24 px, ligado na cor da paleta, rótulo visível e clicável.

### Tables
`Table` com rolagem horizontal própria: cabeçalho em 12 px apagado, linhas separadas por `--line`, números tabulares, hover na linha em poço a 70%. `TransactionRow` e `MoneyText` cobrem as linhas de transação.

### Progress and Feedback
- **ProgressBar:** `role="progressbar"`, 8 px (6 px em `sm`). Cor automática: paleta, aviso a partir de 80%, perigo acima do limite; ao estourar, a barra enche e o texto diz quanto passou ("acima do limite em N%").
- **Skeleton:** blocos pulsantes em `--line`, sempre com região `aria-busy` e texto "Carregando" para leitor de tela.
- **Toast** (react-toastify): superfície do card, borda translúcida, raio 12 px, `shadow-pop`, cores de estado dos tokens, barra de progresso de 3 px.
- **EmptyState:** chip de ícone de 48 px, título, texto e ação opcional. **ConfirmDialog**, **Spinner** e **Kbd** completam o kit.

### Navigation
- **Menu lateral** (`Sidebar`): painel flutuante com logo, botão de recolher, grupos (Visão geral, Movimentações, Contas e cartões, Planejamento) com título recolhível (11 px, 600, caixa alta, apagado, estado salvo no `localStorage`), itens, rodapé com ajustes, card de "Nova despesa" (atalho `N`) e o usuário. Recolhido, mostra só ícones com dica flutuante e o botão de nova despesa vira ícone.
- **Item** (`NavItem`): 34 px de altura, ícone de 18 px, texto 14 px em 500, Tinta Secundária. Hover: poço. **Ativo:** fundo Brasa Névoa, texto e ícone Brasa Texto, peso 600, mesmo realce de topo dos cards, `aria-current="page"`.
- **Topo** (`Topbar`): busca somente leitura que abre a **paleta de comandos** (`Ctrl/⌘ K`, atalho exibido num `Kbd`), sino com contagem, alternador de tema e menu do usuário com navegação por setas e Esc.
- **Celular:** botão de menu, nome da página, overlay de navegação e barra inferior flutuante descrita em Layout.

### Charts
Gráficos Chart.js leem as cores dos tokens por `useThemeColors` (série 1 da paleta, série 2 rosa, série 3 neutra, 4 a 6 categorias, grade a 6% no escuro e 8% no claro, área em degradê da série 1 que some para o fundo). A linha principal é a brasa viva; a tooltip é um elemento HTML próprio (card com `shadow-pop`) que segue o cursor e encaixa no ponto. Animação de 500 ms (`easeOutQuart`), desligada com `prefers-reduced-motion`. Gráfico nunca é a única fonte de um número: o valor aparece também em texto.

### Motion
Transições de cor, borda e sombra em 150 ms; largura do menu, margem do conteúdo e pequenas movimentações em 200 ms, `ease-out`; barra de progresso 300 ms; preenchimento legado em 600 ms. `prefers-reduced-motion: reduce` zera animações e transições globalmente (regra no final de `app.css`) e os componentes de transição de layout usam `motion-reduce:transition-none`. Nada anima propriedades de layout além da largura do menu.

## Do's and Don'ts

### Do:
- **Do** usar os tokens (`bg-surface-raised`, `text-content-muted`, `border-line`, `bg-theme-accent`, `text-danger-strong`) e o kit de `Components/ui`; nunca escrever hex no JSX.
- **Do** usar `bg-theme-accent` para fundo e `text-theme-accent` para texto: o Tailwind mapeia o segundo para o tom que passa de 4,5:1 nos dois modos.
- **Do** garantir contraste de texto 4,5:1 nos dois modos, foco visível (anel de 2 px na cor da paleta, 3:1 no escuro) e rótulo em todo campo (WCAG 2.1 AA).
- **Do** acompanhar toda cor de estado com texto ou seta ("Vencida", "+4,8%", "acima do limite em 12%").
- **Do** usar `MoneyText` para reais, com `−` para gasto, `+` verde para receita e perigo só para estouro.
- **Do** testar qualquer tela nova no escuro, no claro e em pelo menos duas paletas (Brasa e uma fria, como Meia-noite).
- **Do** respeitar `prefers-reduced-motion` em toda animação nova.

### Don't:
- **Don't** usar o destaque da paleta como cor de alerta, nem alerta com a cor da paleta. Alerta é perigo ou aviso, sempre com texto.
- **Don't** colocar texto na cor `accent` pura sobre grafite: use `accent-text`.
- **Don't** criar kickers ou eyebrows (rótulos pequenos em caixa alta acima de títulos). Os títulos de grupo do menu são rótulos de navegação recolhíveis e não servem de modelo para cabeçalhos de seção.
- **Don't** usar sombras duras com deslocamento sem desfoque, halos coloridos difusos, nem relevo neumórfico.
- **Don't** usar glifos de texto ou emoji como ícone; use `lucide-react`.
- **Don't** usar fonte de sistema como face de exibição; a interface é Inter.
- **Don't** aninhar card dentro de card. Dentro de um card use poço, linha ou a tonalidade do `AlertItem`.
- **Don't** transmitir estado só por cor (vencido, pago, prioridade, estouro).
- **Don't** reintroduzir `themed-*` ou `neu-*` em telas novas; elas existem só para as páginas ainda não refeitas.

## Lacunas conhecidas

Registradas por honestidade, não como regra a seguir.
- **Só o Dashboard e o shell seguem o sistema novo.** As demais páginas ainda usam marcação legada (`themed-card`, `themed-stat-card`, `wave-input`, `rounded-2xl`, `shadow-md` e fundos escuros fixos). As classes `themed-*` receberam `!important` e os tokens novos para parecerem com os cards novos até a Fase 4, quando as páginas serão refeitas e o `!important` sai.
- **Telas de entrada (Login e Cadastro):** `.neu-surface`, `.neu-outset`, `.neu-inset` e `.neu-pressable` carregam cores fixas (`#161618`, `#0B0B0C`, `#373738`, `#1C1C1F`) e o JSX usa texto branco fixo, então o card de login é sempre escuro, mesmo no modo claro. O nome `neu-` ficou, o relevo neumórfico saiu.
- **Campos `wave-input`** (rótulo com letras que sobem em cascata, legado) e o `wave-select` com seta SVG em `#64748B` fixo ainda existem nas páginas antigas; os campos do kit (`Input`, `Select`) são o caminho novo.
- **Hex fixos pontuais:** `box-shadow` do `themed-button-primary` com `rgb(15 23 42 / 0.08)` e cores do carrossel de pendências ainda não migraram para tokens.
- **Chart.js legado:** `MonthlySummaryChart` ainda concatena alfa sobre o hex de `primary` retornado por `useThemeColors`.
- **Paleta Brasa tem a única `chart` própria;** nas outras seis, a série 1 cai para `accent` (claro) ou `accentText` (escuro), o que pode dar linha menos viva nas paletas Preto e Ouro.
