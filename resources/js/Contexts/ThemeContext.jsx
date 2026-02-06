import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const THEMES = {
  rose: {
    key: 'rose',
    label: 'Rosé',
    description: 'Tema padrão com tons de vermelho e rosa',
    icon: '🌹',
    colors: {
      primary: '#7b1818',
      primaryHover: '#5c1212',
      primaryLight: 'rgba(244, 63, 94, 0.15)',
      primaryRing: 'rgba(244, 63, 94, 0.5)',
      accent: '#f43f5e',
      accentHover: '#e11d48',
      accentLight: 'rgba(244, 63, 94, 0.1)',
      scrollbar: '#7b1818',
      scrollbarDark: '#fb7185',
      gradient: 'from-[#3a0f0f] to-transparent',
    },
  },
  ocean: {
    key: 'ocean',
    label: 'Oceano',
    description: 'Tons de azul e ciano',
    icon: '🌊',
    colors: {
      primary: '#0e4a7b',
      primaryHover: '#0a3659',
      primaryLight: 'rgba(59, 130, 246, 0.15)',
      primaryRing: 'rgba(59, 130, 246, 0.5)',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentLight: 'rgba(59, 130, 246, 0.1)',
      scrollbar: '#0e4a7b',
      scrollbarDark: '#60a5fa',
      gradient: 'from-[#0e2a4a] to-transparent',
    },
  },
  forest: {
    key: 'forest',
    label: 'Floresta',
    description: 'Tons de verde e esmeralda',
    icon: '🌿',
    colors: {
      primary: '#14532d',
      primaryHover: '#0f3d21',
      primaryLight: 'rgba(34, 197, 94, 0.15)',
      primaryRing: 'rgba(34, 197, 94, 0.5)',
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentLight: 'rgba(34, 197, 94, 0.1)',
      scrollbar: '#14532d',
      scrollbarDark: '#4ade80',
      gradient: 'from-[#0f2d1a] to-transparent',
    },
  },
  sunset: {
    key: 'sunset',
    label: 'Pôr do Sol',
    description: 'Tons de laranja e âmbar',
    icon: '🌅',
    colors: {
      primary: '#7c2d12',
      primaryHover: '#5c2009',
      primaryLight: 'rgba(249, 115, 22, 0.15)',
      primaryRing: 'rgba(249, 115, 22, 0.5)',
      accent: '#f97316',
      accentHover: '#ea580c',
      accentLight: 'rgba(249, 115, 22, 0.1)',
      scrollbar: '#7c2d12',
      scrollbarDark: '#fb923c',
      gradient: 'from-[#3d1a0a] to-transparent',
    },
  },
  lavender: {
    key: 'lavender',
    label: 'Lavanda',
    description: 'Tons de violeta e púrpura',
    icon: '💜',
    colors: {
      primary: '#581c87',
      primaryHover: '#3b0764',
      primaryLight: 'rgba(168, 85, 247, 0.15)',
      primaryRing: 'rgba(168, 85, 247, 0.5)',
      accent: '#a855f7',
      accentHover: '#9333ea',
      accentLight: 'rgba(168, 85, 247, 0.1)',
      scrollbar: '#581c87',
      scrollbarDark: '#c084fc',
      gradient: 'from-[#2d0e43] to-transparent',
    },
  },
  midnight: {
    key: 'midnight',
    label: 'Meia-noite',
    description: 'Tons de índigo e azul escuro',
    icon: '🌙',
    colors: {
      primary: '#312e81',
      primaryHover: '#1e1b4b',
      primaryLight: 'rgba(99, 102, 241, 0.15)',
      primaryRing: 'rgba(99, 102, 241, 0.5)',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      accentLight: 'rgba(99, 102, 241, 0.1)',
      scrollbar: '#312e81',
      scrollbarDark: '#818cf8',
      gradient: 'from-[#1a1845] to-transparent',
    },
  },
}

const ThemeContext = createContext({
  theme: 'rose',
  themeConfig: THEMES.rose,
  themes: THEMES,
  setTheme: () => {},
})

export function ThemeProvider({ children, initialTheme = 'rose' }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return initialTheme
    const stored = window.localStorage.getItem('app-theme')
    return stored && THEMES[stored] ? stored : initialTheme
  })

  const applyTheme = useCallback((themeKey) => {
    const config = THEMES[themeKey]
    if (!config) return

    const root = document.documentElement
    root.setAttribute('data-theme', themeKey)

    Object.entries(config.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  const setTheme = useCallback((themeKey) => {
    if (!THEMES[themeKey]) return
    setThemeState(themeKey)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('app-theme', themeKey)
    }
  }, [])

  const value = {
    theme,
    themeConfig: THEMES[theme] || THEMES.rose,
    themes: THEMES,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export { THEMES }
export default ThemeContext
