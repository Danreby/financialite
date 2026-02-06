import { useMemo } from 'react'
import { useTheme } from '@/Contexts/ThemeContext'

export default function useThemeColors() {
  const { themeConfig } = useTheme()

  const colors = useMemo(() => themeConfig.colors, [themeConfig])

  const chartColors = useMemo(() => ({
    primary: colors.accent,
    primaryBg: colors.primaryLight,
    primaryBorder: colors.accent,
    primaryPoint: colors.accent,
    secondary: 'rgba(59, 130, 246, 1)',
    secondaryBg: 'rgba(59, 130, 246, 0.15)',
    grid: 'rgba(148, 163, 184, 0.2)',
    tick: '#6b7280',
    palette: [
      colors.accent,
      'rgba(59, 130, 246, 0.85)',
      'rgba(34, 197, 94, 0.85)',
      'rgba(234, 179, 8, 0.85)',
      'rgba(168, 85, 247, 0.85)',
      'rgba(14, 116, 144, 0.85)',
    ],
  }), [colors])

  const cssVar = (token) => `var(--theme-${token})`

  return { colors, chartColors, cssVar }
}
