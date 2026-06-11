import React from "react"
import {
  Heart, Shield, TrendingUp, Target,
  AlertCircle, CheckCircle, Clock, Info, Sparkles, Zap,
} from "lucide-react"

const MISSING_DATA_LABELS = {
  incomes:      "Cadastre suas rendas",
  transactions: "Registre transações",
  bills:        "Adicione contas a pagar",
  budget:       "Configure um orçamento",
}

const scoreData = (score) => {
  if (score >= 80) return { label: "Excelente", hex: "#22c55e",            bgCls: "bg-green-50 dark:bg-green-900/20",  txtCls: "text-green-600 dark:text-green-400"  }
  if (score >= 60) return { label: "Bom",       hex: "var(--theme-accent)", bgCls: "bg-theme-accent/10",               txtCls: "text-theme-accent"                    }
  if (score >= 40) return { label: "Regular",   hex: "#f59e0b",            bgCls: "bg-amber-50 dark:bg-amber-900/20", txtCls: "text-amber-600 dark:text-amber-400"  }
  return           { label: "Atenção",  hex: "#ef4444",            bgCls: "bg-red-50 dark:bg-red-900/20",     txtCls: "text-red-600 dark:text-red-400"      }
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

const factorNorm = (key, value) => {
  if (key === "savingsRate")   return Math.min((value / 25) * 100, 100)
  if (key === "emergencyFund") return Math.min((value / 6)  * 100, 100)
  return Math.min(Math.max(value, 0), 100)
}

// Gauge: 270° arc via circle + dashoffset (animatable)
// R=30, center=36,36, viewBox 0 0 72 72, strokeWidth=6
const G_R     = 30
const G_CX    = 36
const G_CY    = 36
const G_CIRC  = 2 * Math.PI * G_R   // ≈ 188.5
const G_ARC   = G_CIRC * 0.75       // ≈ 141.4  (270°)
const G_GAP   = G_CIRC - G_ARC      // ≈ 47.1   (90° gap)

export default function FinancialHealthScore({
  score = 0,
  hasData = true,
  missingData = {},
  factors = {
    savingsRate: 0, budgetAdherence: 0, budgetUsage: 0,
    debtRatio: 0,   emergencyFund: 0,   recurringControl: 0, paymentDiscipline: 0,
  },
}) {
  const sd             = scoreData(score)
  const missingEntries = Object.entries(missingData || {}).filter(([, v]) => v)
  const clampedScore   = Math.min(Math.max(score, 0), 100)
  // strokeDashoffset: G_ARC = empty (score 0), 0 = full (score 100)
  const gaugeOffset    = G_ARC * (1 - clampedScore / 100)

  const factorRows = [
    { key: "savingsRate",       label: "Taxa de Poupança",    Icon: TrendingUp, value: factors.savingsRate,            fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.incomes      },
    { key: "budgetAdherence",   label: "Aderência Orç.",      Icon: Target,     value: factors.budgetAdherence,        fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.budget       },
    { key: "emergencyFund",     label: "Fundo de Reserva",    Icon: Shield,     value: factors.emergencyFund,          fmt: (v) => `${v.toFixed(1)}m`, disabled: !!missingData?.transactions },
    { key: "recurringControl",  label: "Despesas Fixas",      Icon: Heart,      value: factors.recurringControl,       fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.bills        },
    { key: "paymentDiscipline", label: "Disciplina Pag.",     Icon: Clock,      value: factors.paymentDiscipline || 0, fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.bills        },
    { key: "budgetUsage",       label: "Uso do Orçamento",    Icon: Zap,        value: factors.budgetUsage,            fmt: (v) => `${v.toFixed(0)}%`, disabled: !!missingData?.budget       },
  ]

  // 3 highlight indicators shown next to the gauge
  const highlights = ["savingsRate", "emergencyFund", "paymentDiscipline"]

  const buildRec = () => {
    if (score >= 80) return { text: "Parabéns! Sua saúde financeira está excelente.", hex: "#22c55e", Icon: CheckCircle }
    if (!missingData?.transactions && factors.emergencyFund < 3)
      return { text: "Construa uma reserva de emergência cobrindo 3 a 6 meses de despesas.", hex: "#f59e0b", Icon: Shield }
    if (!missingData?.incomes && factors.savingsRate < 10)
      return { text: "Tente poupar pelo menos 10% da sua renda mensal.", hex: "#3b82f6", Icon: TrendingUp }
    if (!missingData?.budget && factors.budgetAdherence < 70)
      return { text: "Várias categorias acima do limite — revise o orçamento.", hex: "#f59e0b", Icon: Target }
    if (!missingData?.bills && factors.recurringControl < 60)
      return { text: "Despesas fixas acima de 40% da renda. Avalie possíveis cortes.", hex: "#ef4444", Icon: AlertCircle }
    return { text: "Continue registrando suas finanças para uma análise mais precisa.", hex: "var(--theme-accent)", Icon: Info }
  }
  const rec     = buildRec()
  const RecIcon = rec.Icon

  const hexBg = (hex) =>
    hex === "var(--theme-accent)"
      ? "color-mix(in srgb, var(--theme-accent, #f43f5e) 12%, transparent)"
      : hex + "1e"

  return (
    <div className="themed-card rounded-2xl p-4 flex-1 min-h-0 flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: hexBg(sd.hex) }}
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
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sd.bgCls} ${sd.txtCls}`}>
            {score >= 80 && <Sparkles className="w-3 h-3" />}
            {sd.label}
          </span>
        )}
      </div>

      {!hasData ? (
        /* ── Empty state ───────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Info className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Dados insuficientes</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 max-w-[180px]">
              Adicione dados financeiros para ver sua pontuação
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
        <>
          {/* ── Score row: gauge + 3 highlight bars ──────────── */}
          <div className="flex items-center gap-3 mb-3 flex-shrink-0">

            {/* Mini gauge */}
            <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
              <svg viewBox="0 0 72 72" className="w-full h-full" aria-hidden="true">
                {/* Track */}
                <circle
                  cx={G_CX} cy={G_CY} r={G_R}
                  fill="none" strokeWidth="6" strokeLinecap="round"
                  stroke="currentColor" className="text-gray-100 dark:text-gray-800"
                  strokeDasharray={`${G_ARC} ${G_GAP}`}
                  transform={`rotate(135 ${G_CX} ${G_CY})`}
                />
                {/* Fill — animated via strokeDashoffset */}
                <circle
                  cx={G_CX} cy={G_CY} r={G_R}
                  fill="none" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${G_ARC} ${G_GAP}`}
                  strokeDashoffset={gaugeOffset}
                  transform={`rotate(135 ${G_CX} ${G_CY})`}
                  style={{
                    stroke: sd.hex,
                    transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-[22px] font-black tabular-nums leading-none"
                  style={{ color: sd.hex }}
                >
                  {Math.round(clampedScore)}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">pts</span>
              </div>
            </div>

            {/* 3 key indicators */}
            <div className="flex-1 min-w-0 space-y-2">
              {highlights.map((key) => {
                const f = factorRows.find((r) => r.key === key)
                if (!f) return null
                const norm  = factorNorm(key, f.value)
                const color = f.disabled ? "#9ca3af" : factorColor(key, f.value)
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: color + "22" }}
                    >
                      <f.Icon className="w-2.5 h-2.5" style={{ color }} />
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${norm}%`, backgroundColor: color }}
                      />
                    </div>
                    <span
                      className="text-[11px] tabular-nums font-bold w-8 text-right flex-shrink-0"
                      style={{ color: f.disabled ? "#9ca3af" : color }}
                    >
                      {f.disabled ? "—" : f.fmt(f.value)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── All indicators (scrollable) ───────────────────── */}
          <div className="border-t border-gray-100 dark:border-white/[0.06] pt-2.5 mb-2 flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Todos os indicadores
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom space-y-1.5">
            {factorRows.map((f) => {
              const norm  = factorNorm(f.key, f.value)
              const color = f.disabled ? "#9ca3af" : factorColor(f.key, f.value)
              return (
                <div
                  key={f.key}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${
                    f.disabled
                      ? "opacity-40"
                      : "bg-gray-50/70 dark:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: color + "22" }}
                  >
                    <f.Icon className="w-3 h-3" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate">
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
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${norm}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Recommendation (pinned bottom) ───────────────── */}
          <div
            className="mt-3 flex items-start gap-2 rounded-xl p-3 flex-shrink-0"
            style={{ backgroundColor: hexBg(rec.hex) }}
          >
            <RecIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: rec.hex }} />
            <p className="text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">
              {rec.text}
            </p>
          </div>

          {/* ── Missing data chips ───────────────────────────── */}
          {missingEntries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 flex-shrink-0">
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
        </>
      )}
    </div>
  )
}