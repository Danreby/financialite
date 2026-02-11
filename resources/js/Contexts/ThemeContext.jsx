import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const THEMES = {
  rose: {
    key: 'rose',
    label: 'Rosé',
    description: 'Tema com vermelho mais forte e vibrante',
    icon: '🌹',
    colors: {
      primary: '#b91c1c',          
      primaryHover: '#991b1b',  
      primaryLight: 'rgba(185, 28, 28, 0.20)',
      primaryRing: 'rgba(185, 28, 28, 0.35)',
      accent: '#ef4444',       
      accentHover: '#c0262e',
      accentLight: 'rgba(239, 68, 68, 0.18)',
      scrollbar: '#b91c1c',
      scrollbarDark: '#ef4444',
      borderDark: 'rgba(185, 28, 28, 0.5)',
      gradient: 'from-[#4c0404] to-transparent',
      bgPageLight: '#fef2f2',
      bgPageDark: '#0a0404',
      bgSidebarLight: '#ffe4e6',
      bgSidebarDark: '#1a0606',
      bgTopbarLight: '#fff1f2',
      bgTopbarDark: '#140505',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#fff5f5',
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
      primaryLight: 'rgba(59, 130, 246, 0.20)',
      primaryRing: 'rgba(59, 130, 246, 0.5)',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentLight: 'rgba(59, 130, 246, 0.18)',
      scrollbar: '#0e4a7b',
      scrollbarDark: '#60a5fa',
      borderDark: 'rgba(10, 30, 74, 0.5)',
      gradient: 'from-[#0e2a4a] to-transparent',
      bgPageLight: '#eff6ff',
      bgPageDark: '#020617',
      bgSidebarLight: '#dbeafe',
      bgSidebarDark: '#0c1e35',
      bgTopbarLight: '#e0f2fe',
      bgTopbarDark: '#0a1829',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#f0f9ff',
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
      primaryLight: 'rgba(34, 197, 94, 0.20)',
      primaryRing: 'rgba(34, 197, 94, 0.5)',
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentLight: 'rgba(34, 197, 94, 0.18)',
      scrollbar: '#14532d',
      scrollbarDark: '#4ade80',
      borderDark: 'rgba(5, 46, 22, 0.5)',
      gradient: 'from-[#0f2d1a] to-transparent',
      bgPageLight: '#f0fdf4',
      bgPageDark: '#021008',
      bgSidebarLight: '#dcfce7',
      bgSidebarDark: '#0a2817',
      bgTopbarLight: '#d1fae5',
      bgTopbarDark: '#071f12',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#f0fdf5',
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
      primaryLight: 'rgba(249, 115, 22, 0.20)',
      primaryRing: 'rgba(249, 115, 22, 0.5)',
      accent: '#f97316',
      accentHover: '#ea580c',
      accentLight: 'rgba(249, 115, 22, 0.18)',
      scrollbar: '#7c2d12',
      scrollbarDark: '#fb923c',
      borderDark: 'rgba(67, 20, 7, 0.5)',
      gradient: 'from-[#3d1a0a] to-transparent',
      bgPageLight: '#fff7ed',
      bgPageDark: '#0c0604',
      bgSidebarLight: '#ffedd5',
      bgSidebarDark: '#1f1108',
      bgTopbarLight: '#fed7aa',
      bgTopbarDark: '#180d05',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#fffbf5',
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
      primaryLight: 'rgba(168, 85, 247, 0.20)',
      primaryRing: 'rgba(168, 85, 247, 0.5)',
      accent: '#a855f7',
      accentHover: '#9333ea',
      accentLight: 'rgba(168, 85, 247, 0.18)',
      scrollbar: '#581c87',
      scrollbarDark: '#c084fc',
      borderDark: 'rgba(46, 16, 101, 0.5)',
      gradient: 'from-[#2d0e43] to-transparent',
      bgPageLight: '#faf5ff',
      bgPageDark: '#0d0416',
      bgSidebarLight: '#f3e8ff',
      bgSidebarDark: '#1e0a2e',
      bgTopbarLight: '#e9d5ff',
      bgTopbarDark: '#150721',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#fbf7ff',
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
      primaryLight: 'rgba(99, 102, 241, 0.20)',
      primaryRing: 'rgba(99, 102, 241, 0.5)',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      accentLight: 'rgba(99, 102, 241, 0.18)',
      scrollbar: '#312e81',
      scrollbarDark: '#818cf8',
      borderDark: 'rgba(30, 27, 75, 0.5)',
      gradient: 'from-[#1a1845] to-transparent',
      bgPageLight: '#eef2ff',
      bgPageDark: '#050614',
      bgSidebarLight: '#e0e7ff',
      bgSidebarDark: '#0f1129',
      bgTopbarLight: '#c7d2fe',
      bgTopbarDark: '#0a0d1f',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#f5f7ff',
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
