import React from 'react'
import { Heart, Shield, TrendingUp, Target, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react'

const MISSING_DATA_LABELS = {
  incomes: 'Cadastre suas rendas',
  transactions: 'Registre transações',
  bills: 'Adicione contas a pagar',
  budget: 'Configure um orçamento',
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
    paymentDiscipline: 0
  }
}) {
  const getScoreLevel = (score) => {
    if (score >= 80) return { label: 'Excelente', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' }
    if (score >= 60) return { label: 'Bom', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' }
    if (score >= 40) return { label: 'Regular', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' }
    return { label: 'Atenção', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' }
  }

  const scoreLevel = getScoreLevel(score)

  const getFactorStatus = (value, thresholds) => {
    if (value >= thresholds.good) return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' }
    if (value >= thresholds.ok) return { icon: AlertCircle, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' }
    return { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' }
  }

  const factorConfigs = [
    {
      key: 'savingsRate',
      label: 'Taxa de Poupança',
      icon: TrendingUp,
      value: factors.savingsRate,
      format: (v) => `${v.toFixed(1)}%`,
      thresholds: { good: 20, ok: 10 },
      description: 'do seu salário é poupado',
      requires: 'incomes',
    },
    {
      key: 'budgetAdherence',
      label: 'Categorias no Limite',
      icon: Target,
      value: factors.budgetAdherence,
      format: (v) => `${v.toFixed(0)}%`,
      thresholds: { good: 80, ok: 60 },
      description: 'das categorias dentro do limite',
      requires: 'budget',
    },
    {
      key: 'budgetUsage',
      label: 'Uso do Orçamento',
      icon: TrendingUp,
      value: factors.budgetUsage,
      format: (v) => `${v.toFixed(0)}%`,
      thresholds: { good: 30, ok: 10 },
      description: 'do orçamento mensal ainda disponível',
      requires: 'budget',
    },
    {
      key: 'emergencyFund',
      label: 'Fundo de Emergência',
      icon: Shield,
      value: factors.emergencyFund,
      format: (v) => `${v.toFixed(1)} meses`,
      thresholds: { good: 6, ok: 3 },
      description: 'de despesas cobertas',
      requires: 'transactions',
    },
    {
      key: 'recurringControl',
      label: 'Controle de Fixos',
      icon: Heart,
      value: factors.recurringControl,
      format: (v) => `${v.toFixed(0)}%`,
      thresholds: { good: 80, ok: 60 },
      description: 'da renda disponível após despesas fixas',
      requires: 'bills',
    },
    {
      key: 'paymentDiscipline',
      label: 'Disciplina de Pagamentos',
      icon: Clock,
      value: factors.paymentDiscipline || 0,
      format: (v) => `${v.toFixed(0)}%`,
      thresholds: { good: 90, ok: 70 },
      description: 'de pagamentos em dia',
      requires: 'bills',
    },
  ]

  const missingEntries = Object.entries(missingData || {}).filter(([, v]) => v)
  const hasMissingData = missingEntries.length > 0

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div className="themed-card rounded-xl p-4 sm:p-6 h-full flex flex-col">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--theme-accent)]" />
          Saúde Financeira
        </h3>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Info className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dados insuficientes
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Para calcular sua saúde financeira, precisamos de mais informações sobre suas finanças.
          </p>
          <div className="space-y-2 w-full max-w-xs">
            {missingEntries.map(([key]) => (
              <div key={key} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>{MISSING_DATA_LABELS[key] || key}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  strokeLinecap="round"
                  className="text-[var(--theme-accent)] transition-all duration-1000 ease-out"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {score.toFixed(0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  de 100
                </div>
              </div>
            </div>

            <div className={`mt-4 px-4 py-2 rounded-full text-sm font-medium ${scoreLevel.bgColor} ${scoreLevel.color}`}>
              {scoreLevel.label}
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto scrollbar-custom space-y-3 sm:space-y-4 pr-1">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">
              Fatores Avaliados
            </div>
            
            {factorConfigs.map((factor) => {
              const isDisabled = factor.requires && missingData?.[factor.requires]
              const status = isDisabled
                ? { icon: Info, color: 'text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800/30' }
                : getFactorStatus(factor.value, factor.thresholds)
              const FactorIcon = factor.icon
              const StatusIcon = status.icon

              return (
                <div
                  key={factor.key}
                  className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${isDisabled ? 'bg-gray-50/50 dark:bg-gray-800/20 opacity-60' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                >
                  <div className={`p-1.5 sm:p-2 rounded-lg bg-transparent dark:bg-transparent border ${status.bgColor} ${status.color} flex items-center justify-center dark:border-gray-700 flex-shrink-0`}>
                    <FactorIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        {factor.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <StatusIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${status.color}`} />
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {isDisabled ? '—' : factor.format(factor.value)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isDisabled ? 'Dados insuficientes para este fator' : factor.description}
                    </p>
                  </div>
                </div>
              )
            })}

            {hasMissingData && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">
                  Melhore sua análise
                </div>
                <div className="space-y-1.5">
                  {missingEntries.map(([key]) => (
                    <div key={key} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{MISSING_DATA_LABELS[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Recomendações
              </div>
              <div className="space-y-2">
                {score < 60 && factors.savingsRate < 10 && !missingData?.incomes && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-[var(--theme-accent)] mt-0.5">•</span>
                    <span>Tente poupar pelo menos 10% da sua renda mensal</span>
                  </div>
                )}
                {factors.emergencyFund < 3 && !missingData?.transactions && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-[var(--theme-accent)] mt-0.5">•</span>
                    <span>Construa um fundo de emergência para 3-6 meses de despesas</span>
                  </div>
                )}
                {factors.budgetAdherence < 70 && !missingData?.budget && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-[var(--theme-accent)] mt-0.5">•</span>
                    <span>Revise seu orçamento e ajuste categorias conforme necessário</span>
                  </div>
                )}
                {factors.budgetUsage < 10 && !missingData?.budget && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-[var(--theme-accent)] mt-0.5">•</span>
                    <span>Seus gastos estão em ou acima do limite do orçamento — revise suas despesas deste mês</span>
                  </div>
                )}
                {factors.recurringControl < 60 && !missingData?.bills && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-[var(--theme-accent)] mt-0.5">•</span>
                    <span>Mais de 40% da sua renda está comprometida com despesas fixas — considere revisar suas obrigações recorrentes</span>
                  </div>
                )}
                {score >= 80 && (
                  <div className="text-xs text-green-600 dark:text-green-400 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 mt-0.5" />
                    <span>Parabéns! Você está mantendo uma excelente saúde financeira</span>
                  </div>
                )}
                {score > 0 && score < 80 && !hasMissingData && factors.savingsRate >= 10 && factors.emergencyFund >= 3 && factors.budgetAdherence >= 70 && factors.budgetUsage >= 10 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-[var(--theme-accent)] mt-0.5">•</span>
                    <span>Continue mantendo seus gastos sob controle para melhorar sua pontuação</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
