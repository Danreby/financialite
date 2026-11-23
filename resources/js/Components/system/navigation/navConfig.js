import {
  ArrowLeftRight,
  CalendarRange,
  ChartColumn,
  CreditCard,
  Info,
  Landmark,
  LayoutDashboard,
  Layers,
  ReceiptText,
  ScrollText,
  Settings,
  Tags,
  TrendingUp,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { toPathname } from '@/Utils/url'

/**
 * Mapa da navegação do app. A mesma lista alimenta o menu lateral, a gaveta
 * do celular, a paleta de comandos (Ctrl K) e o título da página no celular.
 * Orçamentos e Metas ainda não têm página (as rotas budgets.* e savings.*
 * só respondem JSON), por isso não aparecem em Planejamento.
 */
export const NAV_GROUPS = [
  {
    id: 'visao-geral',
    label: 'Visão geral',
    items: [
      { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'início inicio painel' },
      { route: 'resumo-mensal.index', label: 'Resumo mensal', icon: CalendarRange, keywords: 'mês mes' },
      { route: 'reports.index', label: 'Relatórios', icon: ChartColumn, keywords: 'gráficos graficos' },
      { route: 'projecao.index', label: 'Projeção', icon: TrendingUp, keywords: 'previsão previsao futuro' },
    ],
  },
  {
    id: 'movimentacoes',
    label: 'Movimentações',
    items: [
      { route: 'transactions.index', label: 'Todas as transações', icon: ArrowLeftRight, keywords: 'gastos entradas despesas' },
      { route: 'transacoes.index', label: 'Fatura do cartão', icon: ReceiptText, keywords: 'fatura cartão' },
      { route: 'parcelamentos.index', label: 'Parcelamentos', icon: Layers, keywords: 'parcelas' },
      { route: 'extrato.index', label: 'Extrato', icon: ScrollText, keywords: 'saldo conta' },
    ],
  },
  {
    id: 'contas-cartoes',
    label: 'Contas e cartões',
    items: [
      { route: 'bancos.index', label: 'Bancos', icon: Landmark, keywords: 'contas bancárias' },
      { route: 'accounts.index', label: 'Cartões', icon: CreditCard, keywords: 'crédito credito' },
      { route: 'contas.index', label: 'Contas a pagar', icon: WalletCards, keywords: 'boletos vencimento' },
    ],
  },
  {
    id: 'planejamento',
    label: 'Planejamento',
    items: [{ route: 'categorias.index', label: 'Categorias', icon: Tags, keywords: 'etiquetas' }],
  },
]

export const NAV_FOOTER = [
  { route: 'settings', label: 'Configurações', icon: Settings, keywords: 'tema paleta preferências' },
  { route: 'about', label: 'Sobre', icon: Info, keywords: 'ajuda versão' },
]

/** Destinos que não ficam no menu, mas a busca e o título do celular conhecem. */
const EXTRA_DESTINATIONS = [
  { route: 'profile.edit', label: 'Perfil', icon: UserRound, keywords: 'conta senha e-mail' },
]

const hasRoute = (name) => {
  try {
    return route().has(name)
  } catch {
    return false
  }
}

export const visibleGroups = () =>
  NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => hasRoute(item.route)) })).filter(
    (group) => group.items.length > 0,
  )

export const visibleFooter = () => NAV_FOOTER.filter((item) => hasRoute(item.route))

/** Todos os destinos, com o nome do grupo, na ordem do menu. */
export function allDestinations() {
  const fromGroups = visibleGroups().flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
  const rest = [...visibleFooter(), ...EXTRA_DESTINATIONS.filter((item) => hasRoute(item.route))].map((item) => ({
    ...item,
    group: 'Conta',
  }))
  return [...fromGroups, ...rest]
}

export function isActivePath(currentPath, routeName) {
  return currentPath === toPathname(route(routeName))
}

/** Rótulo da página atual (título do topo no celular). */
export function currentPageLabel(currentPath) {
  return allDestinations().find((item) => isActivePath(currentPath, item.route))?.label ?? 'Financialite'
}

export function initialsOf(name) {
  const parts = String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
  if (parts.length === 0) return 'U'
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}
