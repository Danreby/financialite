import { useMemo, useState } from 'react'
import { Link } from '@inertiajs/react'
import { ArrowRight, History } from 'lucide-react'
import { Card, EmptyState, MoneyText, SegmentedControl, Skeleton, Table, TBody, TCell, TH, THead, TRow, TransactionRow } from '@/Components/ui'
import { ACTIVITY_PERIODS, filterByPeriod, toActivityRow } from '@/Lib/dashboard'

function CategoryCell({ category }) {
  if (!category) return <span className="text-content-muted">Sem categoria</span>
  return (
    <span className="flex min-w-0 items-center gap-2" title={category.name}>
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-content-subtle" style={category.color ? { backgroundColor: category.color } : undefined} />
      <span className="truncate">{category.name}</span>
    </span>
  )
}

/**
 * "Atividade recente": as transações que o painel já carrega (as mais
 * recentes por data de cadastro), filtradas aqui por 7 dias, 30 dias ou tudo.
 * Tabela a partir de 640 px; abaixo disso, linhas do kit (TransactionRow).
 */
export default function RecentActivity({ transactions = [], loading, onOpen, className = '' }) {
  const [period, setPeriod] = useState('7d')
  const rows = useMemo(() => filterByPeriod(transactions, period).map((tx) => ({ tx, row: toActivityRow(tx) })), [transactions, period])
  const periodLabel = ACTIVITY_PERIODS.find((p) => p.value === period)?.label

  return (
    <Card
      title="Atividade recente"
      subtitle={loading ? 'Carregando lançamentos' : `Entre os ${transactions.length} lançamentos mais recentes que você cadastrou`}
      actions={
        <Link href={route('transactions.index')} className="hidden items-center gap-1 text-xs font-medium text-theme-accent hover:underline sm:inline-flex">
          Ver todas <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      }
      className={className}
      aria-busy={loading || undefined}
    >
      <SegmentedControl fullWidth label="Período da atividade" options={ACTIVITY_PERIODS} value={period} onChange={setPeriod} className="mb-4" />

      {loading ? (
        <div className="flex flex-col gap-2">
          <span className="sr-only">Carregando atividade</span>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} shape="block" className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={History}
          title={period === 'all' ? 'Nenhum lançamento ainda' : `Nada nos últimos ${periodLabel}`}
          text={period === 'all' ? 'Suas compras e gastos aparecem aqui assim que forem cadastrados.' : 'Escolha "Tudo" para ver os lançamentos mais antigos.'}
          className="py-6"
        />
      ) : (
        <>
          <div className="hidden sm:block">
            <Table caption={`Atividade recente: ${periodLabel}`} className="table-fixed">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[31%]" />
                <col className="w-[19%]" />
                <col className="w-[20%]" />
                <col className="w-[17%]" />
              </colgroup>
              <THead>
                <TRow>
                  <TH>Data</TH>
                  <TH>Descrição</TH>
                  <TH>Categoria</TH>
                  <TH>Cartão ou conta</TH>
                  <TH align="right">Valor</TH>
                </TRow>
              </THead>
              <TBody>
                {rows.map(({ tx, row }) => (
                  <TRow key={row.id}>
                    <TCell className="whitespace-nowrap text-content-muted">
                      <time dateTime={row.isoDate}>{row.date}</time>
                    </TCell>
                    <TCell>
                      <button
                        type="button"
                        onClick={() => onOpen?.(tx)}
                        className="block max-w-full truncate rounded text-left font-medium text-content-primary hover:text-theme-accent"
                        title={row.description}
                      >
                        {row.description}
                      </button>
                      {(row.installments || row.recurring) && (
                        <span className="text-xs text-content-muted">{row.recurring ? 'Recorrente' : `Parcelado em ${row.installments}`}</span>
                      )}
                    </TCell>
                    <TCell>
                      <CategoryCell category={row.category} />
                    </TCell>
                    <TCell>
                      <span className="block truncate" title={`${row.account} (${row.method.toLowerCase()})`}>
                        {row.account}
                      </span>
                      <span className="block text-xs text-content-muted">{row.method}</span>
                    </TCell>
                    <TCell align="right" className="whitespace-nowrap">
                      <MoneyText value={row.amount} type="expense" className="font-semibold" />
                    </TCell>
                  </TRow>
                ))}
              </TBody>
            </Table>
          </div>

          <ul className="-mx-2 flex flex-col sm:hidden">
            {rows.map(({ tx, row }) => (
              <li key={row.id}>
                <TransactionRow
                  as="button"
                  type="expense"
                  onClick={() => onOpen?.(tx)}
                  className="w-full text-left"
                  description={row.description}
                  amount={row.amount}
                  meta={[row.category?.name, row.account, row.date]}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <Link href={route('transactions.index')} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-theme-accent hover:underline sm:hidden">
        Ver todas as transações <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </Card>
  )
}
