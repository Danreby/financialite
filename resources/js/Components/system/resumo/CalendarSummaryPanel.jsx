import React, { useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  CalendarDays,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import { getIconEmoji } from '@/Utils/categoryIcons'

function StatCard({ icon: Icon, label, value, color = 'gray', subtext }) {
  const colorMap = {
    red: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
    green: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
    gray: 'bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/30">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">
          {value}
        </p>
        {subtext && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  )
}

export default function CalendarSummaryPanel({ data = {} }) {
  const { summary = {}, expenses_by_category = [], expenses_by_card = [], calendar = [] } = data

  const calendarStats = useMemo(() => {
    if (!calendar || calendar.length === 0) return null

    const daysWithTransactions = calendar.filter(d => d.count > 0)
    const totalTransactions = calendar.reduce((sum, d) => sum + d.count, 0)
    const totalSpent = calendar.reduce((sum, d) => sum + (d.total || 0), 0)

    const mostExpensiveDay = daysWithTransactions.length > 0
      ? daysWithTransactions.reduce((max, d) => d.total > max.total ? d : max, daysWithTransactions[0])
      : null

    const avgPerActiveDay = daysWithTransactions.length > 0
      ? totalSpent / daysWithTransactions.length
      : 0

    return {
      daysWithTransactions: daysWithTransactions.length,
      totalDays: calendar.length,
      totalTransactions,
      totalSpent,
      mostExpensiveDay,
      avgPerActiveDay,
    }
  }, [calendar])

  const topCategories = useMemo(() => {
    return (expenses_by_category || []).slice(0, 5)
  }, [expenses_by_category])

  const topCards = useMemo(() => {
    return (expenses_by_card || []).slice(0, 4)
  }, [expenses_by_card])

  return (
    <div className="flex flex-col gap-4">
      <div className="themed-card rounded-2xl p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-[var(--theme-accent)]" />
          Resumo do Mês
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <StatCard
            icon={ArrowUpRight}
            label="Receitas"
            value={formatCurrencyBRL(summary.total_income || 0)}
            color="green"
          />
          <StatCard
            icon={ArrowDownRight}
            label="Despesas"
            value={formatCurrencyBRL(summary.total_expenses || 0)}
            color="red"
          />
          <StatCard
            icon={Banknote}
            label="Saldo"
            value={formatCurrencyBRL(summary.balance || 0)}
            color={(summary.balance || 0) >= 0 ? 'green' : 'red'}
          />
          {calendarStats && (
            <StatCard
              icon={CalendarDays}
              label="Dias ativos"
              value={`${calendarStats.daysWithTransactions} / ${calendarStats.totalDays}`}
              color="blue"
              subtext={`${calendarStats.totalTransactions} transações`}
            />
          )}
        </div>
      </div>

      {calendarStats && (
        <div className="themed-card rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-[var(--theme-accent)]" />
            Análise do Calendário
          </h3>
          <div className="space-y-2">
            {calendarStats.mostExpensiveDay && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/15">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Dia mais caro</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(calendarStats.mostExpensiveDay.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </div>
                <span className="text-sm font-bold text-red-500 dark:text-red-400">
                  {formatCurrencyBRL(calendarStats.mostExpensiveDay.total)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/30">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Média por dia ativo</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrencyBRL(calendarStats.avgPerActiveDay)}
                </p>
              </div>
              <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                {calendarStats.daysWithTransactions} dias
              </span>
            </div>
          </div>
        </div>
      )}

      {topCategories.length > 0 && (
        <div className="themed-card rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[var(--theme-accent)]" />
            Top Categorias
          </h3>
          <div className="space-y-2">
            {topCategories.map((cat, idx) => {
              const maxTotal = topCategories[0]?.total || 1
              const barWidth = Math.max((cat.total / maxTotal) * 100, 4)

              return (
                <div key={cat.category_id ?? idx} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {cat.category_icon && (
                        <span className="text-xs flex-shrink-0">
                          {getIconEmoji(cat.category_icon) || cat.category_icon}
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {cat.category_name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">
                      {formatCurrencyBRL(cat.total)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: cat.category_color || 'var(--theme-accent)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {topCards.length > 0 && (
        <div className="themed-card rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-[var(--theme-accent)]" />
            Cartões
          </h3>
          <div className="space-y-2">
            {topCards.map((card, idx) => (
              <div
                key={card.bank_user_id ?? idx}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/30"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {card.card_name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {card.count} {card.count === 1 ? 'transação' : 'transações'}
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">
                  {formatCurrencyBRL(card.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
