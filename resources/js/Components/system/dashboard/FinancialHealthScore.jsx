import React from "react"
import {
  Heart, Shield, TrendingUp, Target,
  AlertCircle, CheckCircle, Clock, Info, Sparkles, Zap,
} from "lucide-react"

const MISSING_DATA_LABELS = {
  incomes: "Cadastre suas rendas",
  transactions: "Registre transações",
  bills: "Adicione contas a pagar",
  budget: "Configure um orçamento",
}

const scoreData = (score) => {
  if (score >= 80) return { label: "Excelente", hex: "#22c55e", cls: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30" }
  if (score >= 60) return { label: "Bom", hex: "var(--theme-accent)", cls: "text-theme-accent", bg: "bg-theme-accent/10 dark:bg-theme-accent/20" }
  if (score >= 40) return { label: "Regular", hex: "#f59e0b", cls: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" }
  return { label: "Atenção", hex: "#ef4444", cls: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30" }
}

const THRESHOLDS = {
  savingsRate:       { good: 20, ok: 10 },
  budgetAdherence:   { good: 80, ok: 60 },
  budgetUsage:       { good: 30, ok: 10 },
  emergencyFund:     { good: 6,  ok: 3  },
  recurringControl:  { good: 80, ok: 60 },
  paymentDiscipline: { good: 90, ok: 70 },
}

const factorColor = (key, value) => {
  const t = THRESHOLDS[key] || { good: 80, ok: 50 }
  if (value >= t.good) return "#22c55e"
  if (value >= t.ok)   return "#f59e0b"
  return "#ef4444"
}

const _R   = 40
const _CX  = 55
const _CY  = 55
const _sx  = _CX + _R * Math.cos((135 * Math.PI) / 180)
const _sy  = _CY + _R * Math.sin((135 * Math.PI) / 180)
const _ex  = _CX + _R * Math.cos((45  * Math.PI) / 180)
const _ey  = _CY + _R * Math.sin((45  * Math.PI) / 180)
const ARC_PATH  = `M ${_sx.toFixed(2)} ${_sy.toFixed(2)} A ${_R} ${_R} 0 1 0 ${_ex.toFixed(2)} ${_ey.toFixed(2)}`
const ARC_TOTAL = (270 / 360) * 2 * Math.PI * _R

const factorNorm = (key, value) => {
  if (key === "savingsRate")    return Math.min((value / 25) * 100, 100)
  if (key === "emergencyFund")  return Math.min((value / 6) * 100, 100)
  return Math.min(Math.max(value, 0), 100)
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
  const sd = scoreData(score)
  const missingEntries = Object.entries(missingData || {}).filter(([, v]) => v)
  const fillOffset = ARC_TOTAL * (1 - Math.min(score, 100) / 100)

  const factorRows = [
    { key: "savingsRate",       label: "Taxa de Poupança",   Icon: TrendingUp, value: factors.savingsRate,            fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.incomes },
    { key: "budgetAdherence",   label: "Aderência ao Orç.",  Icon: Target,     value: factors.budgetAdherence,        fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.budget },
    { key: "emergencyFund",     label: "Fundo de Reserva",   Icon: Shield,     value: factors.emergencyFund,          fmt: (v) => `${v.toFixed(1)}m`, disabled: !!missingData?.transactions },
    { key: "recurringControl",  label: "Despesas Fixas",     Icon: Heart,      value: factors.recurringControl,       fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.bills },
    { key: "paymentDiscipline", label: "Disciplina de Pag.", Icon: Clock,      value: factors.paymentDiscipline || 0, fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.bills },
    { key: "budgetUsage",       label: "Uso do Orçamento",   Icon: Zap,        value: factors.budgetUsage,            fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.budget },
  ]

  const buildRec = () => {
    if (score >= 80) return { text: "Parabéns! Você mantém uma saúde financeira excelente.", hex: "#22c55e", Icon: CheckCircle }
    if (!missingData?.transactions && factors.emergencyFund < 3)
      return { text: "Construa uma reserva de emergência cobrindo 3 a 6 meses de despesas.", hex: "#f59e0b", Icon: Shield }
    if (!missingData?.incomes && factors.savingsRate < 10)
      return { text: "Tente poupar pelo menos 10% da sua renda para garantir segurança futura.", hex: "#3b82f6", Icon: TrendingUp }
    if (!missingData?.budget && factors.budgetAdherence < 70)
      return { text: "Várias categorias estão acima do limite. Revise seu orçamento.", hex: "#f59e0b", Icon: Target }
    if (!missingData?.bills && factors.recurringControl < 60)
      return { text: "Mais de 40% da renda está em despesas fixas. Avalie possíveis cortes.", hex: "#ef4444", Icon: AlertCircle }
    return { text: "Continue registrando suas finanças para uma análise mais precisa.", hex: "var(--theme-accent)", Icon: Info }
  }
  const rec = buildRec()
  const RecIcon = rec.Icon

  const accentBg = (hex) =>
    hex === "var(--theme-accent)"
      ? "var(--theme-bgCardLight, rgba(99,102,241,0.12))"
      : hex + "1a"

  return (
    <div className="themed-card rounded-2xl p-4 flex flex-col flex-1 min-h-0">

      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: accentBg(sd.hex) }}
          >
            <Heart className="w-3.5 h-3.5" style={{ color: sd.hex }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              Saúde Financeira
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">pontuação geral</p>
          </div>
        </div>
        {hasData && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sd.bg} ${sd.cls}`}>
            {score >= 80 && <Sparkles className="w-3 h-3" />}
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
                <div
                  key={key}
                  className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5"
                >
                  <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span>{MISSING_DATA_LABELS[key] || key}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 gap-3">

          <div className="flex items-center gap-3 flex-shrink-0">

            <div className="relative flex-shrink-0" style={{ width: 110, height: 96 }}>
              <svg viewBox="0 0 110 96" className="w-full h-full" overflow="visible">
                <defs>
                  <filter id="fhs-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d={ARC_PATH}
                  fill="none"
                  strokeWidth="9"
                  strokeLinecap="round"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-gray-800"
                />
                <path
                  d={ARC_PATH}
                  fill="none"
                  strokeWidth="9"
                  strokeLinecap="round"
                  stroke={sd.hex}
                  strokeDasharray={ARC_TOTAL}
                  strokeDashoffset={fillOffset}
                  filter={score >= 50 ? "url(#fhs-glow)" : undefined}
                  style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)" }}
                />
              </svg>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ paddingBottom: 12 }}
              >
                <span
                  className="text-[28px] font-black tabular-nums leading-none"
                  style={{ color: sd.hex }}
                >
                  {Math.round(score)}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                  / 100 pts
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              {["savingsRate", "emergencyFund", "paymentDiscipline"].map((key) => {
                const f = factorRows.find((r) => r.key === key)
                if (!f) return null
                const norm = factorNorm(key, f.value)
                const color = f.disabled ? "#9ca3af" : factorColor(key, f.value)
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: color + "1e" }}
                    >
                      <f.Icon className="w-2.5 h-2.5" style={{ color }} />
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${norm}%`,
                          backgroundColor: color,
                          transition: "width 0.9s cubic-bezier(.4,0,.2,1)",
                        }}
                      />
                    </div>
                    <span
                      className="text-[11px] tabular-nums w-9 text-right flex-shrink-0 font-bold"
                      style={{ color: f.disabled ? "#9ca3af" : color }}
                    >
                      {f.disabled ? "—" : f.fmt(f.value)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom flex flex-col">
            <div className="border-t border-gray-100 dark:border-white/[0.06] pt-2.5 mb-2 flex-shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Todos os Indicadores
              </span>
            </div>

            <div className="space-y-1.5">
              {factorRows.map((f) => {
                const norm = factorNorm(f.key, f.value)
                const color = f.disabled ? "#9ca3af" : factorColor(f.key, f.value)
                return (
                  <div
                    key={f.key}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${
                      f.disabled
                        ? "opacity-40 bg-gray-50/40 dark:bg-gray-800/20"
                        : "bg-gray-50/70 dark:bg-white/[0.03] hover:bg-gray-100/80 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <div
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: color + "1e" }}
                    >
                      <f.Icon className="w-3 h-3" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate leading-tight">
                          {f.label}
                        </span>
                        <span
                          className="text-[11px] tabular-nums font-bold ml-2 flex-shrink-0"
                          style={{ color: f.disabled ? "#9ca3af" : color }}
                        >
                          {f.disabled ? "—" : f.fmt(f.value)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${norm}%`,
                            backgroundColor: color,
                            transition: "width 0.9s cubic-bezier(.4,0,.2,1)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="flex items-start gap-2.5 rounded-xl p-3 flex-shrink-0"
            style={{ backgroundColor: accentBg(rec.hex) }}
          >
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg mt-0.5"
              style={{
                backgroundColor:
                  rec.hex === "var(--theme-accent)"
                    ? "var(--theme-bgCardLight, rgba(99,102,241,0.2))"
                    : rec.hex + "28",
              }}
            >
              <RecIcon className="w-3 h-3" style={{ color: rec.hex }} />
            </div>
            <p className="text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">
              {rec.text}
            </p>
          </div>

          {missingEntries.length > 0 && (
            <div className="flex flex-wrap gap-1 flex-shrink-0">
              {missingEntries.map(([key]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px]"
                >
                  <AlertCircle className="w-2.5 h-2.5" />
                  {MISSING_DATA_LABELS[key]}
                </span>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
