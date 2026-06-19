import React from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Wallet } from 'lucide-react';
import FaturaProgressRing from '@/Components/system/fatura/FaturaProgressRing';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import { formatCurrency } from '@/Lib/formatters';

function StatBox({ label, value, variant = 'default' }) {
	const valueClass = {
		paid: 'text-emerald-600 dark:text-emerald-400',
		remaining: 'themed-amount',
		default: 'text-gray-800 dark:text-gray-100',
		muted: 'text-gray-400 dark:text-gray-600',
	}[variant];

	return (
		<div className="flex flex-col gap-0.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5">
			<p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
				{label}
			</p>
			<p className={`text-sm sm:text-base font-bold leading-tight ${valueClass}`}>
				{value}
			</p>
		</div>
	);
}

export default function FaturaPaymentSummaryCard({
	monthLabel,
	totalSpent = 0,
	totalPending,
	totalPaid = 0,
	isPaid = false,
	isPartiallyPaid = false,
	hasRemainingPostPayment = false,
	isCurrentPending = false,
	onPayFull,
	onPayPartial,
}) {
	const pendingBase = totalPending ?? totalSpent;
	const remaining = Math.max(0, pendingBase - totalPaid);
	const progressPercent = totalSpent > 0 ? Math.round(Math.min(totalPaid / totalSpent, 1) * 100) : 0;
	const hasPayments = totalPaid > 0;

	return (
		<div
			className={`rounded-2xl themed-card shadow-sm overflow-hidden transition-colors ${
				isPaid
					? 'bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50'
					: hasRemainingPostPayment
					? 'bg-white dark:bg-[#080808] border border-orange-200/70 dark:border-orange-900/40'
					: isPartiallyPaid
					? 'bg-white dark:bg-[#080808] border border-amber-200/70 dark:border-amber-900/40'
					: 'bg-white dark:bg-[#080808]'
			}`}
		>
			<div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
				<div className="flex items-center gap-2">
					<CreditCard className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
					<h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
						Pagamento da fatura
					</h3>
				</div>

				{isPaid && (
					<div className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1">
						<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
						<span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
							Paga
						</span>
					</div>
				)}

				{hasRemainingPostPayment && !isPaid && (
					<span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:text-orange-400">
						Novas cobranças
					</span>
				)}

				{isPartiallyPaid && !isPaid && !hasRemainingPostPayment && (
					<span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
						Parcial
					</span>
				)}
			</div>

			<div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 px-4 sm:px-5 pb-4 sm:pb-5">
				<div className="shrink-0">
					<FaturaProgressRing
						totalSpent={totalSpent}
						totalPaid={totalPaid}
						isPaid={isPaid}
						size={136}
					>
						<span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mb-1">
							Total
						</span>
						<span
							className={`text-base sm:text-[17px] font-bold leading-tight ${
								isPaid
									? 'text-emerald-600 dark:text-emerald-400'
									: 'text-gray-900 dark:text-gray-50'
							}`}
						>
							{formatCurrency(totalSpent)}
						</span>
						{totalSpent > 0 && (
							<span
								className={`text-[11px] font-medium leading-none mt-1 ${
									isPaid ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
								}`}
							>
								{progressPercent}%
							</span>
						)}
					</FaturaProgressRing>
				</div>

				<div className="flex-1 w-full space-y-3">
					<div>
						<div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
							<div
								className={`h-full rounded-full transition-all duration-700 ease-out ${
									isPaid
										? 'bg-emerald-500 dark:bg-emerald-400'
										: hasPayments
										? 'bg-[var(--theme-accent)]'
										: 'bg-gray-200 dark:bg-gray-700'
								}`}
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
						{hasPayments && !isPaid && (
							<p className="mt-1 text-right text-[11px] text-gray-400 dark:text-gray-500">
								{progressPercent}% pago
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-2">
						<StatBox
							label="Pago"
							value={formatCurrency(totalPaid)}
							variant={hasPayments || isPaid ? 'paid' : 'muted'}
						/>
						<StatBox
							label={isPaid ? 'Quitado' : 'A pagar'}
							value={formatCurrency(isPaid ? totalSpent : remaining)}
							variant={isPaid ? 'muted' : 'remaining'}
						/>
					</div>

					{hasRemainingPostPayment && (
						<div className="flex items-start gap-2 rounded-xl bg-orange-50/80 dark:bg-orange-900/20 border border-orange-200/80 dark:border-orange-800/40 px-3 py-2.5">
							<AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-orange-500 dark:text-orange-400" />
							<p className="text-xs text-orange-700 dark:text-orange-300 font-medium leading-snug">
								Novas cobranças foram adicionadas após o pagamento desta fatura.
								Pague o valor restante para quitá-la completamente.
							</p>
						</div>
					)}

					{(!isPaid || hasRemainingPostPayment) && (
						<div className="flex flex-col xs:flex-row gap-2 pt-0.5">
							<PrimaryButton
								type="button"
								onClick={onPayFull}
								className="flex-1 justify-center rounded-full px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wide"
							>
								{isPartiallyPaid || hasRemainingPostPayment ? 'Pagar restante' : 'Pagar tudo'}
							</PrimaryButton>
							<SecondaryButton
								type="button"
								onClick={onPayPartial}
								className="flex-1 justify-center rounded-full px-4 py-2 text-[11px] sm:text-xs font-medium"
							>
								<Wallet className="w-3.5 h-3.5 mr-1 shrink-0" />
								Valor personalizado
							</SecondaryButton>
						</div>
					)}

					{isPaid && !hasRemainingPostPayment && (
						<div className="flex items-center gap-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/20 px-3 py-2.5">
							<CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
							<p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
								Fatura quitada com sucesso!
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
