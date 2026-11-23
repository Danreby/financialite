import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { router } from '@inertiajs/react'
import PALETTE_DATA from '@/Constants/palettes.json'

/*
 * Aparência do app: paleta (cor de destaque) + modo claro/escuro.
 *
 * Fonte única de verdade:
 * - `app.css` define os tokens neutros (superfícies, texto, linhas, cores
 *   semânticas, gráficos) e o padrão da paleta brasa, em canais RGB ("242 84 27").
 * - Este contexto escreve só as variáveis da paleta escolhida (`--accent*` e
 *   `--chart-1`) no <html>, já resolvidas para o modo atual, e alterna a
 *   classe `dark`.
 *
 * Modo: o escuro é o padrão quando o usuário não salvou nada (`color_mode`
 * nulo). 'light' e 'dark' fixam o modo; 'system' segue o sistema operacional.
 *
 * As paletas pintam só o destaque (item ativo, botão principal, foco,
 * destaque de gráfico). As superfícies são neutras em todas as paletas.
 *
 * Contraste (WCAG AA), conferido com texto branco sobre `accent`:
 * brasa 5,18 (claro, #C2410C) / 4,62 (escuro, #D2430E) · rosé 4,70 · floresta (verde-azulado) 5,47 · ouro (bronze) 4,86 ·
 * lavanda 5,70 · meia-noite 6,29 · preto 14,68 (claro) / 7,56 (escuro).
 * Floresta e ouro ficam longe do verde de sucesso e do âmbar de alerta,
 * para a paleta nunca se confundir com um estado. `accentText` passa de 4,5:1 sobre a
 * superfície do cartão e sobre o fundo `accentSoft` nos dois modos.
 * `chart` (opcional) é o tom vivo da linha principal dos gráficos; sem ele,
 * o gráfico usa `accentText` no escuro e `accent` no claro.
 */

// Valores das paletas: resources/js/Constants/palettes.json (também lido
// pelo Blade para pintar a primeira tela já com a paleta certa).
const PALETTES = Object.fromEntries(
  Object.entries(PALETTE_DATA).map(([key, palette]) => [key, { key, ...palette }]),
)

const DEFAULT_PALETTE = 'brasa'
const DEFAULT_MODE = 'dark'
const COLOR_MODES = ['light', 'dark', 'system']

// Chaves de localStorage herdadas das versões anteriores; continuam válidas.
const PALETTE_STORAGE_KEY = 'app-theme'
const MODE_STORAGE_KEY = 'theme' // 'light' | 'dark' | 'system'; ausente = padrão (escuro)

const SURFACE_BASE = { light: '#F4F4F5', dark: '#0B0B0C' }

function hexToChannels(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')
}

function hexToRgba(hex, alpha) {
  return `rgba(${hexToChannels(hex).split(' ').join(', ')}, ${alpha})`
}

// Formato antigo (`colors` em hex) para quem ainda lê a paleta em JS:
// gráficos (useThemeColors) e o seletor em Configurações.
function legacyColors(palette) {
  const { light } = palette
  return {
    primary: light.accentHover,
    primaryHover: light.accentHover,
    primaryLight: light.accentSoft,
    primaryRing: hexToRgba(light.accent, 0.35),
    accent: light.accent,
    accentHover: light.accentHover,
    accentLight: light.accentSoft,
  }
}

const THEMES = Object.fromEntries(
  Object.entries(PALETTES).map(([key, palette]) => [key, { ...palette, colors: legacyColors(palette) }]),
)

function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // modo privado ou armazenamento bloqueado: segue só com o estado em memória
  }
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveMode(colorMode) {
  if (colorMode === 'dark' || colorMode === 'light') return colorMode
  if (colorMode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return DEFAULT_MODE
}

function isColorMode(value) {
  return COLOR_MODES.includes(value)
}

/**
 * Lê a preferência inicial: servidor (usuário logado) > cache local > padrão.
 * `color_mode` nulo no servidor significa "sem escolha" (vale o escuro), mas
 * uma escolha antiga guardada só no navegador (chave `theme`) ainda é respeitada.
 */
export function readInitialAppearance(user) {
  const storedPalette = typeof window !== 'undefined' ? safeGet(PALETTE_STORAGE_KEY) : null
  const storedMode = typeof window !== 'undefined' ? safeGet(MODE_STORAGE_KEY) : null

  const palette = (user?.theme && PALETTES[user.theme] && user.theme)
    || (storedPalette && PALETTES[storedPalette] && storedPalette)
    || DEFAULT_PALETTE

  const colorMode = isColorMode(user?.color_mode) ? user.color_mode
    : isColorMode(storedMode) ? storedMode
    : DEFAULT_MODE

  return { palette, colorMode }
}

/** Escreve as variáveis da paleta e a classe `dark` no <html>. Sem React, para rodar antes do primeiro render. */
export function applyAppearance(paletteKey, mode) {
  if (typeof document === 'undefined') return
  const palette = PALETTES[paletteKey] || PALETTES[DEFAULT_PALETTE]
  const values = palette[mode] || palette.light
  const root = document.documentElement

  root.classList.toggle('dark', mode === 'dark')
  root.setAttribute('data-theme', palette.key)
  root.setAttribute('data-color-mode', mode)

  root.style.setProperty('--accent', hexToChannels(values.accent))
  root.style.setProperty('--accent-hover', hexToChannels(values.accentHover))
  root.style.setProperty('--accent-soft', hexToChannels(values.accentSoft))
  root.style.setProperty('--accent-text', hexToChannels(values.accentText))
  // Anel de foco: no escuro usa o tom claro para passar de 3:1 sobre o grafite.
  root.style.setProperty('--accent-ring', hexToChannels(mode === 'dark' ? values.accentText : values.accent))
  // Linha principal dos gráficos: tom vivo da paleta (a área em degradê deriva dele no CSS).
  root.style.setProperty('--chart-1', hexToChannels(values.chart || (mode === 'dark' ? values.accentText : values.accent)))

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', SURFACE_BASE[mode] || SURFACE_BASE.light)
}

const ThemeContext = createContext({
  theme: DEFAULT_PALETTE,
  themeConfig: THEMES[DEFAULT_PALETTE],
  themes: THEMES,
  colorMode: DEFAULT_MODE,
  resolvedMode: DEFAULT_MODE,
  isDark: true,
  setTheme: async () => {},
  setColorMode: async () => {},
  toggleColorMode: async () => {},
})

function persist(changes, isAuthenticated) {
  if (!isAuthenticated) return Promise.resolve()
  return axios.patch(route('settings.theme'), changes)
}

export function ThemeProvider({ children, initialUser = null }) {
  const initial = useMemo(() => readInitialAppearance(initialUser), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [theme, setThemeState] = useState(initial.palette)
  const [colorMode, setColorModeState] = useState(initial.colorMode)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)
  const userRef = useRef(initialUser)

  const resolvedMode = colorMode === 'system' ? (systemDark ? 'dark' : 'light') : colorMode

  // Layout effect: as variáveis já estão no <html> quando os efeitos dos filhos
  // (ex.: useThemeColors lendo as cores dos gráficos) rodam.
  useLayoutEffect(() => {
    applyAppearance(theme, resolvedMode)
  }, [theme, resolvedMode])

  // Acompanha a troca de tema do sistema enquanto o modo for "sistema".
  useEffect(() => {
    if (!window.matchMedia) return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemDark(event.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // O provider fica acima do Inertia; a cada navegação pega o usuário atual
  // para aplicar o que está salvo no servidor (ex.: logo após o login).
  useEffect(() => {
    return router.on('navigate', (event) => {
      const user = event.detail?.page?.props?.auth?.user ?? null
      const previous = userRef.current
      userRef.current = user
      if (!user || previous?.id === user.id) return

      const next = readInitialAppearance(user)
      setThemeState(next.palette)
      safeSet(PALETTE_STORAGE_KEY, next.palette)
      // Sem modo salvo no servidor, vale o padrão (escuro): o cache do usuário
      // anterior neste navegador não vale para quem acabou de entrar.
      const saved = isColorMode(user.color_mode) ? user.color_mode : null
      setColorModeState(saved || DEFAULT_MODE)
      safeSet(MODE_STORAGE_KEY, saved)
    })
  }, [])

  const setTheme = useCallback(async (key) => {
    if (!PALETTES[key]) return
    const previous = theme
    setThemeState(key)
    safeSet(PALETTE_STORAGE_KEY, key)
    try {
      await persist({ theme: key }, !!userRef.current)
    } catch (error) {
      setThemeState(previous)
      safeSet(PALETTE_STORAGE_KEY, previous)
      throw error
    }
  }, [theme])

  const setColorMode = useCallback(async (mode) => {
    if (!COLOR_MODES.includes(mode)) return
    setColorModeState(mode)
    safeSet(MODE_STORAGE_KEY, mode)
    try {
      await persist({ color_mode: mode }, !!userRef.current)
    } catch {
      // A troca já valeu nesta sessão e ficou no cache local; o servidor
      // recebe a próxima mudança. Não vale interromper o usuário por isso.
    }
  }, [])

  const toggleColorMode = useCallback(
    () => setColorMode(resolvedMode === 'dark' ? 'light' : 'dark'),
    [resolvedMode, setColorMode],
  )

  const value = useMemo(() => ({
    theme,
    themeConfig: THEMES[theme] || THEMES[DEFAULT_PALETTE],
    themes: THEMES,
    colorMode,
    resolvedMode,
    isDark: resolvedMode === 'dark',
    setTheme,
    setColorMode,
    toggleColorMode,
  }), [theme, colorMode, resolvedMode, setTheme, setColorMode, toggleColorMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

export { THEMES, PALETTES }
export default ThemeContext
