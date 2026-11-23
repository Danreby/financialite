import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { CalendarRange, CreditCard, FileSpreadsheet, Receipt, Tag, TrendingUp } from 'lucide-react'
import { Card } from '@/Components/ui'
import CardForm from '@/Components/system/CardForm'
import CategoryForm from '@/Components/system/CategoryForm'
import FaturaImportModal from '@/Components/system/fatura/import/FaturaImportModal'
import { useNewTransaction } from '@/Components/system/transactions/NewTransactionProvider'

const TILE =
  'group flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-chip border border-line bg-surface-sunken/60 px-2 py-3 text-center ' +
  'text-[13px] font-medium leading-tight text-content-secondary transition-[background-color,border-color,color] duration-150 ease-out ' +
  'hover:border-line-strong hover:bg-surface-sunken hover:text-content-primary'

function Tile({ icon: Icon, label, ...props }) {
  const Tag = props.href ? Link : 'button'
  return (
    <Tag type={props.href ? undefined : 'button'} className={TILE} {...props}>
      <span className="icon-chip transition-colors duration-150 group-hover:text-theme-accent">
        <Icon aria-hidden="true" />
      </span>
      <span className="text-balance">{label}</span>
    </Tag>
  )
}

/**
 * Seis atalhos em grade 3×2, ícone em cima e o rótulo inteiro embaixo.
 * Despesa e entrada usam os formulários globais (NewTransactionProvider).
 */
export default function QuickActions({ categories = [], onChanged, className = '' }) {
  const { openNewTransaction, openNewIncome } = useNewTransaction()
  const [open, setOpen] = useState(null)
  const close = () => setOpen(null)

  return (
    <>
      <Card title="Ações rápidas" className={className}>
        <div className="grid grid-cols-2 gap-2.5 min-[480px]:grid-cols-3">
          <Tile icon={Receipt} label="Nova despesa" onClick={openNewTransaction} />
          <Tile icon={TrendingUp} label="Nova entrada" onClick={openNewIncome} />
          <Tile icon={CreditCard} label="Adicionar cartão" onClick={() => setOpen('card')} />
          <Tile icon={Tag} label="Adicionar categoria" onClick={() => setOpen('category')} />
          <Tile icon={CalendarRange} label="Resumo mensal" href={route('resumo-mensal.index')} />
          <Tile icon={FileSpreadsheet} label="Importar planilha" onClick={() => setOpen('import')} />
        </div>
      </Card>

      <CardForm
        isOpen={open === 'card'}
        onClose={close}
        onSuccess={() => router.reload({ only: ['bankAccounts'], preserveScroll: true, preserveState: true })}
      />
      <CategoryForm
        isOpen={open === 'category'}
        onClose={close}
        categories={categories}
        onSuccess={() => router.reload({ only: ['categories'], preserveScroll: true, preserveState: true })}
      />
      <FaturaImportModal isOpen={open === 'import'} onClose={close} onImported={onChanged} />
    </>
  )
}
