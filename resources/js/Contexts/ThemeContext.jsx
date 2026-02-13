import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const THEMES = {
  rose: {
    key: 'rose',
    label: 'Rosé',
    description: 'Tema com vermelho mais forte e vibrante',
    icon: '🌹',
    colors: {
      primary: '#b22222',
      primaryHover: '#8b1a1a',
      primaryLight: '#fecaca',
      primaryRing: 'rgba(178, 34, 34, 0.5)',
      accent: '#dc2626',
      accentHover: '#b91c1c',
      accentLight: '#fee2e2',
      accentSecondary: '#ef4444',
      accentTertiary: '#f87171',
      scrollbar: '#b22222',
      scrollbarDark: '#ef4444',
      borderDark: 'rgba(185, 28, 28, 0.5)',
      gradient: 'from-[#4c0404] to-transparent',
      bgPageLight: '#fef2f2',
      bgPageDark: '#0a0404',
      bgSidebarLight: '#fee2e2',
      bgSidebarDark: '#1a0606',
      bgTopbarLight: '#fecaca',
      bgTopbarDark: '#140505',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#fff5f5',
      bgButtonPrimary: '#fda4af',
      bgButtonPrimaryHover: '#fb7185',
      bgButtonPrimaryDark: '#be123c',
      bgButtonPrimaryDarkHover: '#9f1239',
    },
  },
  // ocean: {
  //   key: 'ocean',
  //   label: 'Oceano',
  //   description: 'Tons de azul e ciano',
  //   icon: '🌊',
  //   colors: {
  //     primary: '#1e40af',
  //     primaryHover: '#1e3a8a',
  //     primaryLight: '#bfdbfe',
  //     primaryRing: 'rgba(30, 64, 175, 0.5)',
  //     accent: '#3b82f6',
  //     accentHover: '#2563eb',
  //     accentLight: '#dbeafe',
  //     accentSecondary: '#60a5fa',
  //     accentTertiary: '#93c5fd',
  //     scrollbar: '#1e40af',
  //     scrollbarDark: '#60a5fa',
  //     borderDark: 'rgba(30, 58, 138, 0.5)',
  //     gradient: 'from-[#0e2a4a] to-transparent',
  //     bgPageLight: '#eff6ff',
  //     bgPageDark: '#020617',
  //     bgSidebarLight: '#dbeafe',
  //     bgSidebarDark: '#0c1e35',
  //     bgTopbarLight: '#bfdbfe',
  //     bgTopbarDark: '#0a1829',
  //     bgCardLight: '#ffffff',
  //     bgCardLightHover: '#f0f9ff',
  //     bgButtonPrimary: '#93c5fd',
  //     bgButtonPrimaryHover: '#60a5fa',
  //     bgButtonPrimaryDark: '#1e40af',
  //     bgButtonPrimaryDarkHover: '#1e3a8a',
  //   },
  // },
  forest: {
    key: 'forest',
    label: 'Floresta',
    description: 'Tons de verde e esmeralda',
    icon: '🌿',
    colors: {
      primary: '#15803d',
      primaryHover: '#166534',
      primaryLight: '#bbf7d0',
      primaryRing: 'rgba(21, 128, 61, 0.5)',
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentLight: '#dcfce7',
      accentSecondary: '#4ade80',
      accentTertiary: '#86efac',
      scrollbar: '#15803d',
      scrollbarDark: '#4ade80',
      borderDark: 'rgba(22, 101, 52, 0.5)',
      gradient: 'from-[#0f2d1a] to-transparent',
      bgPageLight: '#f0fdf4',
      bgPageDark: '#021008',
      bgSidebarLight: '#dcfce7',
      bgSidebarDark: '#0a2817',
      bgTopbarLight: '#bbf7d0',
      bgTopbarDark: '#071f12',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#f0fdf5',
      bgButtonPrimary: '#86efac',
      bgButtonPrimaryHover: '#4ade80',
      bgButtonPrimaryDark: '#15803d',
      bgButtonPrimaryDarkHover: '#166534',
    },
  },
  gold: {
    key: 'gold',
    label: 'Ouro',
    description: 'Tons de dourado e âmbar',
    icon: '✨',
    colors: {
      primary: '#d97706',
      primaryHover: '#b45309',
      primaryLight: '#fde68a',
      primaryRing: 'rgba(217, 119, 6, 0.5)',
      accent: '#f59e0b',
      accentHover: '#d97706',
      accentLight: '#fef3c7',
      accentSecondary: '#eab308',
      accentTertiary: '#ca8a04',
      scrollbar: '#d97706',
      scrollbarDark: '#fbbf24',
      borderDark: 'rgba(180, 83, 9, 0.5)',
      gradient: 'from-[#3f2a0a] to-transparent',
      bgPageLight: '#fffbeb',
      bgPageDark: '#0f0a02',
      bgSidebarLight: '#fef3c7',
      bgSidebarDark: '#1f1607',
      bgTopbarLight: '#fde68a',
      bgTopbarDark: '#1a1005',
      bgCardLight: '#fffef5',
      bgCardLightHover: '#fefce8',
      bgButtonPrimary: '#fde68a',
      bgButtonPrimaryHover: '#fbbf24',
      bgButtonPrimaryDark: '#d97706',
      bgButtonPrimaryDarkHover: '#b45309',
    },
  },
  lavender: {
    key: 'lavender',
    label: 'Lavanda',
    description: 'Tons de violeta e púrpura',
    icon: '💜',
    colors: {
      primary: '#7c3aed',
      primaryHover: '#6d28d9',
      primaryLight: '#ddd6fe',
      primaryRing: 'rgba(124, 58, 237, 0.5)',
      accent: '#a855f7',
      accentHover: '#9333ea',
      accentLight: '#ede9fe',
      accentSecondary: '#c084fc',
      accentTertiary: '#d8b4fe',
      scrollbar: '#7c3aed',
      scrollbarDark: '#c084fc',
      borderDark: 'rgba(109, 40, 217, 0.5)',
      gradient: 'from-[#2d0e43] to-transparent',
      bgPageLight: '#faf5ff',
      bgPageDark: '#0d0416',
      bgSidebarLight: '#ede9fe',
      bgSidebarDark: '#1e0a2e',
      bgTopbarLight: '#ddd6fe',
      bgTopbarDark: '#150721',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#fbf7ff',
      bgButtonPrimary: '#d8b4fe',
      bgButtonPrimaryHover: '#c084fc',
      bgButtonPrimaryDark: '#7c3aed',
      bgButtonPrimaryDarkHover: '#6d28d9',
    },
  },
  midnight: {
    key: 'midnight',
    label: 'Meia-noite',
    description: 'Tons de índigo e azul escuro',
    icon: '🌙',
    colors: {
      primary: '#4f46e5',
      primaryHover: '#4338ca',
      primaryLight: '#c7d2fe',
      primaryRing: 'rgba(79, 70, 229, 0.5)',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      accentLight: '#e0e7ff',
      accentSecondary: '#818cf8',
      accentTertiary: '#a5b4fc',
      scrollbar: '#4f46e5',
      scrollbarDark: '#818cf8',
      borderDark: 'rgba(67, 56, 202, 0.5)',
      gradient: 'from-[#1a1845] to-transparent',
      bgPageLight: '#eef2ff',
      bgPageDark: '#050614',
      bgSidebarLight: '#e0e7ff',
      bgSidebarDark: '#0f1129',
      bgTopbarLight: '#c7d2fe',
      bgTopbarDark: '#0a0d1f',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#f5f7ff',
      bgButtonPrimary: '#a5b4fc',
      bgButtonPrimaryHover: '#818cf8',
      bgButtonPrimaryDark: '#4f46e5',
      bgButtonPrimaryDarkHover: '#4338ca',
    },
  },
   sunset: {
    key: 'sunset',
    label: 'Pôr do Sol',
    description: 'Tons de laranja e âmbar',
    icon: '🌅',
    colors: {
      primary: '#c2410c',
      primaryHover: '#9a3412',
      primaryLight: '#fed7aa',
      primaryRing: 'rgba(194, 65, 12, 0.5)',
      accent: '#f97316',
      accentHover: '#ea580c',
      accentLight: '#ffedd5',
      scrollbar: '#c2410c',
      scrollbarDark: '#fb923c',
      borderDark: 'rgba(154, 52, 18, 0.5)',
      gradient: 'from-[#3d1a0a] to-transparent',
      bgPageLight: '#fff7ed',
      bgPageDark: '#0c0604',
      bgSidebarLight: '#ffedd5',
      bgSidebarDark: '#1f1108',
      bgTopbarLight: '#fed7aa',
      bgTopbarDark: '#180d05',
      bgCardLight: '#ffffff',
      bgCardLightHover: '#fffbf5',
      bgButtonPrimary: '#f97316',
      bgButtonPrimaryHover: '#ea580c',
      bgButtonPrimaryDark: '#c2410c',
      bgButtonPrimaryDarkHover: '#9a3412',
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
