import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatCurrencyBRL } from '@/Lib/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const isDark = () => document.documentElement.classList.contains('dark')

export default function ReportsSpendingTrendChart({ monthlySummary = [] }) {
  const dark = isDark()

  const { labels, debitData, creditData } = useMemo(() => {
    const sorted = [...monthlySummary].sort((a, b) =>
      (a.year_month || '').localeCompare(b.year_month || '')
    )
    return {
      labels: sorted.map((m) => m.month_label || m.year_month || ''),
      debitData: sorted.map((m) => m.total_debit || 0),
      creditData: sorted.map((m) => m.total_credit || 0),
    }
  }, [monthlySummary])

  const tooltipBg = dark ? 'rgba(15,15,23,0.96)' : 'rgba(255,255,255,0.98)'
  const tooltipBdr = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tooltipTxt = dark ? '#f9fafb' : '#111827'
  const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const tickColor = dark ? '#9ca3af' : '#6b7280'

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Débito',
        data: debitData,
        backgroundColor: 'rgba(239,68,68,0.78)',
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: 'Crédito (parcela)',
        data: creditData,
        backgroundColor: 'rgba(16,185,129,0.75)',
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  }), [labels, debitData, creditData])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: tickColor,
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          useBorderRadius: true,
          font: { size: 11 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBdr,
        borderWidth: 1,
        titleColor: tooltipTxt,
        bodyColor: dark ? '#9ca3af' : '#4b5563',
        padding: { top: 9, bottom: 9, left: 13, right: 15 },
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => `  ${ctx.dataset.label}: ${formatCurrencyBRL(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 10 }, maxRotation: 45 },
        border: { display: false },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          font: { size: 10 },
          callback: (value) => {
            if (value >= 1000) return `R$\u00a0${(value / 1000).toFixed(0)}k`
            return `R$\u00a0${value}`
          },
        },
        border: { display: false },
      },
    },
  }), [dark, tooltipBg, tooltipBdr, tooltipTxt, gridColor, tickColor])

  if (monthlySummary.length === 0) {
    return (
      <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tendência de gastos
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Nenhuma transação encontrada.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tendência de gastos
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Débito e crédito por mês no período
          </p>
        </div>
      </div>
      <div className="h-60 sm:h-72">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
