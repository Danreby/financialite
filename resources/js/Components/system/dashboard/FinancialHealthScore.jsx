import React from 'react'
import {
  Heart, Shield, TrendingUp, Target,
  AlertCircle, CheckCircle, Clock, Info,
} from 'lucide-react'

const MISSING_DATA_LABELS = {
  incomes: 'Cadastre suas rendas',
  transactions: 'Registre transações',
  bills: 'Adicione contas a pagar',
  budget: 'Configure um orçamento',
}

const scoreData = (score) => {
  if (score >= 80) return { label: 'Excelente', hex: '#22c55e', cls: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' }
  if (score >= 60) return { label: 'Bom', hex: 'var(--theme-accent)', cls: 'text-theme-accent', bg: 'bg-theme-accent/10 dark:bg-theme-accent/20' }
  if (score >= 40) return { label: 'Regular', hex: '#f59e0b', cls: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' }
  return { label: 'Atenção', hex: '#ef4444', cls: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' }
}

const factorNorm = (key, value) => {
  if (key === 'savingsRate') return Math.min((value / 25) * 100, 100)
  if (key === 'emergencyFund') return Math.min((value / 6) * 100, 100)
  return Math.min(Math.max(value, 0), 100)
}

const THRESHOLDS = {
  savingsRate: { good: 20, ok: 10 },
  budgetAdherence: { good: 80, ok: 60 },
  budgetUsage: { good: 30, ok: 10 },
  emergencyFund: { good: 6,  ok: 3  },
  recurringControl: { good: 80, ok: 60 },
  paymentDiscipline: { good: 90, ok: 70 },
}

const factorColor = (key, value) => {
  const t = THRESHOLDS[key] || { good: 80, ok: 50 }
  if (value >= t.good) return '#22c55e'
  if (value >= t.ok) return '#f59e0b'
  return '#ef4444'
}

export default function FinancialHealthScore({
  score = 0,
  hasData = true,
  missingData = {},
  factors = {
    savingsRate: 0,
    budgetAdherence: 0,
    budgetUsage: 0,
    debtRatio: 0,
    emergencyFund: 0,
    recurringControl: 0,
    paymentDiscipline: 0,
  },
}) {
  const sd   = scoreData(score)
  const missingEntries = Object.entries(missingData || {}).filter(([, v]) => v)

  const R    = 36
  const circ = 2 * Math.PI * R
  const dash = (score / 100) * circ

  const factorRows = [
    { key: 'savingsRate', label: 'Poupança', Icon: TrendingUp, value: factors.savingsRate, fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.incomes },
    { key: 'budgetAdherence', label: 'Aderência', Icon: Target, value: factors.budgetAdherence, fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.budget },
    { key: 'emergencyFund', label: 'Reserva', Icon: Shield, value: factors.emergencyFund, fmt: (v) => `${v.toFixed(1)}m`, disabled: !!missingData?.transactions },
    { key: 'recurringControl', label: 'Fixos', Icon: Heart, value: factors.recurringControl, fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.bills },
    { key: 'paymentDiscipline', label: 'Pagamentos', Icon: Clock, value: factors.paymentDiscipline||0, fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.bills },
    { key: 'budgetUsage', label: 'Uso Orç.', Icon: TrendingUp, value: factors.budgetUsage, fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.budget },
  ]

  const buildRec = () => {
    if (score >= 80) return { text: 'Parabéns! Você mantém uma saúde financeira excelente. Continue assim!', hex: '#22c55e', Icon: CheckCircle }
    if (!missingData?.transactions && factors.emergencyFund < 3)
      return { text: 'Construa uma reserva de emergência cobrindo 3 a 6 meses de despesas.', hex: '#f59e0b', Icon: Shield }
    if (!missingData?.incomes && factors.savingsRate < 10)
      return { text: 'Tente poupar pelo menos 10% da sua renda para garantir segurança futura.', hex: '#3b82f6', Icon: TrendingUp }
    if (!missingData?.budget && factors.budgetAdherence < 70)
      return { text: 'Várias categorias estão acima do limite. Revise e ajuste seu orçamento.', hex: '#f59e0b', Icon: Target }
    if (!missingData?.bills && factors.recurringControl < 60)
      return { text: 'Mais de 40% da renda está em despesas fixas. Avalie possíveis cortes.', hex: '#ef4444', Icon: AlertCircle }
    return { text: 'Continue registrando suas finanças para uma análise mais precisa.', hex: 'var(--theme-accent)', Icon: Info }
  }
  const rec = buildRec()
  const RecIcon = rec.Icon

  return (
    <div className="themed-card rounded-2xl p-4 flex flex-col">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20">
            <Heart className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              Saúde Financeira
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">pontuação geral</p>
          </div>
        </div>
        {hasData && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${sd.bg} ${sd.cls}`}>
            {sd.label}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Info className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Dados insuficientes</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 max-w-[180px]">
              Adicione mais dados financeiros para ver sua pontuação
            </p>
          </div>
          {missingEntries.length > 0 && (
            <div className="space-y-1.5 w-full max-w-xs">
              {missingEntries.map(([key]) => (
                <div key={key} className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span>{MISSING_DATA_LABELS[key] || key}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">

            <div className="relative w-[88px] h-[88px] flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={R} strokeWidth="8" fill="none"
                  stroke="currentColor" className="text-gray-100 dark:text-gray-800" />
                <circle cx="50" cy="50" r={R} strokeWidth="8" fill="none"
                  stroke={sd.hex} strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ - dash}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold tabular-nums leading-none text-gray-900 dark:text-gray-100">
                  {Math.round(score)}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500">/ 100</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">Principais fatores</p>
              {['savingsRate', 'emergencyFund', 'paymentDiscipline'].map((key) => {
                const f = factorRows.find((r) => r.key === key)
                if (!f) return null
                const norm  = factorNorm(key, f.value)
                const color = f.disabled ? '#9ca3af' : factorColor(key, f.value)
                return (
                  <div key={key} className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 w-16 flex-shrink-0 truncate">
                      {f.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${norm}%`, backgroundColor: color, transition: 'width 0.8s ease-out' }} />
                    </div>
                    <span className="text-[10px] tabular-nums w-8 text-right flex-shrink-0 font-medium" style={{ color: f.disabled ? '#9ca3af' : color }}>
                      {f.disabled ? '—' : f.fmt(f.value)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Todos os fatores
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {factorRows.map((f) => {
              const norm  = factorNorm(f.key, f.value)
              const color = f.disabled ? '#9ca3af' : factorColor(f.key, f.value)
              const FIcon = f.Icon
              return (
                <div
                  key={f.key}
                  className={`rounded-xl p-2.5 ${f.disabled ? 'opacity-50 bg-gray-50/60 dark:bg-gray-800/30' : 'bg-gray-50 dark:bg-white/[0.04]'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FIcon className="w-3 h-3 flex-shrink-0" style={{ color }} />
                    <span className="flex-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate">{f.label}</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
                      {f.disabled ? '—' : f.fmt(f.value)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${norm}%`, backgroundColor: color, transition: 'width 0.8s ease-out' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-start gap-2.5 rounded-xl p-2.5" style={{ backgroundColor: rec.hex === 'var(--theme-accent)' ? 'var(--theme-bgCardLight, rgba(99,102,241,.12))' : rec.hex + '18' }}>
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg mt-0.5"
              style={{ backgroundColor: rec.hex === 'var(--theme-accent)' ? 'var(--theme-bgCardLight, rgba(99,102,241,.2))' : rec.hex + '28' }}>
              <RecIcon className="w-3 h-3" style={{ color: rec.hex }} />
            </div>
            <p className="text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">{rec.text}</p>
          </div>

          {missingEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {missingEntries.map(([key]) => (
                <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px]">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {MISSING_DATA_LABELS[key]}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
