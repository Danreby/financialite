import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { router } from '@inertiajs/react'

/*
 * Aparência do app: paleta (cor de destaque) + modo claro/escuro.
 *
 * Fonte única de verdade:
 * - `app.css` define os tokens neutros (superfícies, texto, linhas, cores
 *   semânticas) e o padrão da paleta rosé, em canais RGB ("225 29 72").
 * - Este contexto escreve só as variáveis de destaque da paleta escolhida
 *   (`--accent*`) no <html>, já resolvidas para o modo atual, e alterna a
 *   classe `dark`.
 *
 * As paletas pintam só o destaque (item ativo, botão principal, foco,
 * destaque de gráfico). As superfícies são neutras em todas as paletas.
 *
 * Contraste (WCAG AA), conferido com texto branco sobre `accent`:
 * rosé 4,70 · floresta 5,48 · ouro 5,02 · lavanda 5,70 · meia-noite 6,29 ·
 * preto 14,68 (claro) / 7,56 (escuro). `accentText` passa de 4,5:1 sobre a
 * superfície do cartão e sobre o fundo `accentSoft` nos dois modos.
 */

const PALETTES = {
  rose: {
    key: 'rose',
    label: 'Rosé',
    description: 'Rosa intenso',
    light: { accent: '#E11D48', accentHover: '#BE123C', accentSoft: '#FFF1F2', accentText: '#BE123C' },
    dark: { accent: '#E11D48', accentHover: '#BE123C', accentSoft: '#322434', accentText: '#FB7185' },
  },
  forest: {
    key: 'forest',
    label: 'Floresta',
    description: 'Verde esmeralda',
    light: { accent: '#047857', accentHover: '#065F46', accentSoft: '#ECFDF5', accentText: '#047857' },
    dark: { accent: '#047857', accentHover: '#065F46', accentSoft: '#163237', accentText: '#34D399' },
  },
  gold: {
    key: 'gold',
    label: 'Ouro',
    description: 'Dourado e âmbar',
    light: { accent: '#B45309', accentHover: '#92400E', accentSoft: '#FFFBEB', accentText: '#B45309' },
    dark: { accent: '#B45309', accentHover: '#92400E', accentSoft: '#322F27', accentText: '#FBBF24' },
  },
  lavender: {
    key: 'lavender',
    label: 'Lavanda',
    description: 'Violeta e púrpura',
    light: { accent: '#7C3AED', accentHover: '#6D28D9', accentSoft: '#F5F3FF', accentText: '#6D28D9' },
    dark: { accent: '#7C3AED', accentHover: '#6D28D9', accentSoft: '#262845', accentText: '#A78BFA' },
  },
  midnight: {
    key: 'midnight',
    label: 'Meia-noite',
    description: 'Índigo e azul escuro',
    light: { accent: '#4F46E5', accentHover: '#4338CA', accentSoft: '#EEF2FF', accentText: '#4338CA' },
    dark: { accent: '#4F46E5', accentHover: '#4338CA', accentSoft: '#212844', accentText: '#818CF8' },
  },
  black: {
    key: 'black',
    label: 'Preto',
    description: 'Grafite e preto',
    light: { accent: '#1F2937', accentHover: '#111827', accentSoft: '#F3F4F6', accentText: '#1F2937' },
    dark: { accent: '#4B5563', accentHover: '#374151', accentSoft: '#2C3240', accentText: '#D1D5DB' },
  },
}

const DEFAULT_PALETTE = 'rose'
const COLOR_MODES = ['light', 'dark', 'system']

// Chaves de localStorage herdadas das versões anteriores; continuam válidas.
const PALETTE_STORAGE_KEY = 'app-theme'
const MODE_STORAGE_KEY = 'theme' // 'light' | 'dark'; ausente = seguir o sistema

const SURFACE_BASE = { light: '#F8FAFC', dark: '#0B0F14' }

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
  return systemPrefersDark() ? 'dark' : 'light'
}

/**
 * Lê a preferência inicial: servidor (usuário logado) > cache local > padrão.
 * `color_mode` nulo no servidor significa "seguir o sistema", mas uma escolha
 * antiga guardada só no navegador (chave `theme`) ainda é respeitada.
 */
export function readInitialAppearance(user) {
  const storedPalette = typeof window !== 'undefined' ? safeGet(PALETTE_STORAGE_KEY) : null
  const storedMode = typeof window !== 'undefined' ? safeGet(MODE_STORAGE_KEY) : null

  const palette = (user?.theme && PALETTES[user.theme] && user.theme)
    || (storedPalette && PALETTES[storedPalette] && storedPalette)
    || DEFAULT_PALETTE

  const colorMode = (user?.color_mode === 'light' || user?.color_mode === 'dark') ? user.color_mode
    : (storedMode === 'light' || storedMode === 'dark') ? storedMode
    : 'system'

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

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', SURFACE_BASE[mode] || SURFACE_BASE.light)
}

const ThemeContext = createContext({
  theme: DEFAULT_PALETTE,
  themeConfig: THEMES[DEFAULT_PALETTE],
  themes: THEMES,
  colorMode: 'system',
  resolvedMode: 'light',
  isDark: false,
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

  useEffect(() => {
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
      if (user.color_mode === 'light' || user.color_mode === 'dark') {
        setColorModeState(user.color_mode)
        safeSet(MODE_STORAGE_KEY, user.color_mode)
      }
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
    safeSet(MODE_STORAGE_KEY, mode === 'system' ? null : mode)
    try {
      await persist({ color_mode: mode === 'system' ? null : mode }, !!userRef.current)
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
