import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '@/Contexts/ThemeContext'

/*
 * Cores dos gráficos lidas dos tokens do CSS (resources/css/app.css):
 * `--chart-1` (paleta do usuário, tom vivo), `--chart-2` (rosa companheira),
 * `--chart-3` (neutra), `--chart-4..6` (categorias), `--chart-grid`,
 * `--chart-tick` e o degradê da área (`--chart-area-from` → `--chart-area-to`).
 *
 * O Chart.js precisa de cores prontas (não entende `var()`), então o hook lê
 * os valores calculados no <html> e devolve em hex (séries) ou rgba (efeitos).
 * Relê quando a paleta ou o modo mudam; o ThemeProvider grava as variáveis num
 * layout effect, antes deste efeito rodar.
 */

// Usados só se o CSS ainda não carregou (ex.: primeira renderização em dev).
const FALLBACK = {
  dark: {
    'chart-1': '242 84 27', 'chart-2': '244 114 182', 'chart-3': '161 161 170',
    'chart-4': '96 165 250', 'chart-5': '45 212 191', 'chart-6': '167 139 250',
    'chart-grid': 'rgb(255 255 255 / 0.06)', 'chart-tick': '154 154 160',
    'chart-area-from': 'rgb(242 84 27 / 0.28)', 'chart-area-to': 'rgb(242 84 27 / 0)',
  },
  light: {
    'chart-1': '242 84 27', 'chart-2': '219 39 119', 'chart-3': '113 113 122',
    'chart-4': '37 99 235', 'chart-5': '13 148 136', 'chart-6': '124 58 237',
    'chart-grid': 'rgb(24 24 27 / 0.08)', 'chart-tick': '82 82 91',
    'chart-area-from': 'rgb(242 84 27 / 0.2)', 'chart-area-to': 'rgb(242 84 27 / 0)',
  },
}

const NAMES = Object.keys(FALLBACK.dark)

// "242 84 27", "rgb(242 84 27 / 0.28)" ou "rgb(242, 84, 27)" → [r, g, b, a]
function parseColor(value) {
  const nums = String(value).match(/-?[\d.]+/g)?.map(Number) || []
  if (nums.length < 3) return null
  return [nums[0], nums[1], nums[2], nums.length > 3 ? nums[3] : 1]
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`
}

function toRgba([r, g, b, a = 1]) {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function readTokens(mode) {
  const fallback = FALLBACK[mode] || FALLBACK.dark
  const style = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null
  return Object.fromEntries(NAMES.map((name) => {
    const raw = style?.getPropertyValue(`--${name}`).trim()
    return [name, parseColor(raw) || parseColor(fallback[name])]
  }))
}

export default function useThemeColors() {
  const { themeConfig, theme, resolvedMode } = useTheme()
  const [tokens, setTokens] = useState(() => readTokens(resolvedMode))

  useEffect(() => {
    setTokens(readTokens(resolvedMode))
  }, [theme, resolvedMode])

  const colors = useMemo(() => themeConfig.colors, [themeConfig])

  const chartColors = useMemo(() => {
    const series = ['chart-1', 'chart-2', 'chart-3'].map((name) => toHex(tokens[name]))
    const [series1, series2, series3] = series
    const [r2, g2, b2] = tokens['chart-2']

    return {
      // Nomes antigos: `primary` continua em hex (MonthlySummaryChart concatena alfa).
      primary: series1,
      primaryBg: toRgba(tokens['chart-area-from']),
      primaryBorder: series1,
      primaryPoint: series1,
      secondary: series2,
      secondaryBg: toRgba([r2, g2, b2, 0.12]),
      grid: toRgba(tokens['chart-grid']),
      tick: toHex(tokens['chart-tick']),
      // Novos
      series: [series1, series2, series3],
      neutral: series3,
      areaFrom: toRgba(tokens['chart-area-from']),
      areaTo: toRgba(tokens['chart-area-to']),
      // Categorias: paleta, rosa, azul, verde-azulado, violeta, neutro.
      palette: ['chart-1', 'chart-2', 'chart-4', 'chart-5', 'chart-6', 'chart-3'].map((name) => toHex(tokens[name])),
    }
  }, [tokens])

  const cssVar = (token) => `var(--theme-${token})`

  return { colors, chartColors, cssVar }
}
