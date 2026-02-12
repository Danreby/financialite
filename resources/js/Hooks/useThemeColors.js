import { useMemo } from 'react'
import { useTheme } from '@/Contexts/ThemeContext'

export default function useThemeColors() {
  const { themeConfig } = useTheme()

  const colors = useMemo(() => themeConfig.colors, [themeConfig])

  const chartColors = useMemo(() => {
    // Detectar se está em modo dark
    const isDark = document.documentElement.classList.contains('dark')
    
    return {
      primary: colors.primary,
      primaryBg: isDark ? `${colors.primary}18` : `${colors.accent}08`,
      primaryBorder: colors.accent,
      primaryPoint: colors.accent,
      secondary: isDark ? 'rgba(59, 130, 246, 1)' : '#2563eb',
      secondaryBg: isDark ? 'rgba(59, 130, 246, 0.10)' : 'rgba(37, 99, 235, 0.05)',
      grid: 'rgba(148, 163, 184, 0.2)',
      tick: '#6b7280',
      // Paleta com cores sólidas para modo light e levemente transparentes para dark
      palette: [
        colors.accent,
        isDark ? 'rgba(59, 130, 246, 0.85)' : '#3b82f6',
        isDark ? 'rgba(34, 197, 94, 0.85)' : '#22c55e',
        isDark ? 'rgba(234, 179, 8, 0.85)' : '#eab308',
        isDark ? 'rgba(168, 85, 247, 0.85)' : '#a855f7',
        isDark ? 'rgba(14, 116, 144, 0.85)' : '#0e7490',
      ],
    }
  }, [colors])

  const cssVar = (token) => `var(--theme-${token})`

  return { colors, chartColors, cssVar }
}
