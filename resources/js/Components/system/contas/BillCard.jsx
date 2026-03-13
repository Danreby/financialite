import { motion } from 'framer-motion';
import { formatCurrency, formatDueDay, getNextDueInfo } from '@/Utils/bills';
import { getIconEmoji } from '@/Utils/categoryIcons';

const STATUS_MAP = {
	active: { label: 'Ativa', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
	inactive: { label: 'Inativa', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

const RECURRENCE_MAP = {
	monthly: 'Mensal',
	yearly: 'Anual',
	none: 'Única',
};

export default function BillCard({ bill, onEdit, onPay, onToggle, onDelete, saving }) {
	const dueInfo = getNextDueInfo(bill);
	const statusInfo = STATUS_MAP[bill.status] || STATUS_MAP.active;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className={`group relative rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:bg-gray-900/50 ${
				bill.status === 'inactive'
					? 'border-gray-200/50 opacity-60 dark:border-gray-800/50'
					: dueInfo?.paid
						? 'border-emerald-200 dark:border-emerald-900/40'
						: dueInfo?.overdue
							? 'border-red-200 dark:border-red-900/40'
							: dueInfo?.today
								? 'border-amber-200 dark:border-amber-900/40'
								: 'border-gray-200/70 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
			}`}
		>
			<div className="p-3 sm:p-4">
				<div className="flex items-start gap-3">
					<div
						className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg sm:text-xl"
						style={{
							backgroundColor: (bill.color || '#3b82f6') + '18',
							color: bill.color || '#3b82f6',
						}}
					>
						{bill.category?.icon ? (
						<span>{getIconEmoji(bill.category.icon) || bill.category.icon}</span>
						) : (
							<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
							</svg>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
								{bill.title}
							</h3>
							<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusInfo.color}`}>
								{statusInfo.label}
							</span>
						</div>

						<div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
							<span className="font-semibold text-gray-900 dark:text-gray-100">
								{formatCurrency(bill.amount)}
							</span>
							<span className="text-gray-300 dark:text-gray-600">|</span>
							<span>{RECURRENCE_MAP[bill.recurrence_type] || '—'}</span>
							<span className="text-gray-300 dark:text-gray-600">|</span>
							<span>Venc. {formatDueDay(bill.due_day)}</span>
						</div>

						{bill.description && (
							<p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs">
								{bill.description}
							</p>
						)}

						{dueInfo && bill.status === 'active' && (
							<div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-0.5 ${
							dueInfo.paid
								? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
								: dueInfo.overdue
									? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
									: dueInfo.today
										? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
										: dueInfo.soon
											? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
											: 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
						}`}>
							{dueInfo.paid && (
								<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
								</svg>
							)}
							{dueInfo.overdue && !dueInfo.paid && (
								<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
								</svg>
							)}
							{dueInfo.text}
						</div>
					)}

						{bill.category && (
							<div className="mt-1.5 flex items-center gap-1">
								<span
									className="inline-block w-2 h-2 rounded-full"
									style={{ backgroundColor: bill.category.color || '#6b7280' }}
								/>
								<span className="text-[11px] text-gray-400 dark:text-gray-500">{bill.category.name}</span>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
					{bill.status === 'active' && !dueInfo?.paid && (
							<button
								type="button"
								onClick={() => onPay(bill)}
								disabled={saving}
								className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors dark:hover:bg-emerald-900/20"
								title="Pagar conta"
							>
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</button>
						)}
						<button
							type="button"
							onClick={() => onEdit(bill)}
							disabled={saving}
							className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:text-theme-accent hover:bg-theme-accent/10 transition-colors dark:text-gray-400"
							title="Editar"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
							</svg>
						</button>
						<button
							type="button"
							onClick={() => onToggle(bill)}
							disabled={saving}
							className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-50 transition-colors dark:text-gray-400 dark:hover:bg-amber-900/20"
							title={bill.status === 'active' ? 'Desativar' : 'Ativar'}
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d={bill.status === 'active'
									? "M15.75 5.25v13.5m-7.5-13.5v13.5"
									: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
								} />
							</svg>
						</button>
						<button
							type="button"
							onClick={() => onDelete(bill)}
							disabled={saving}
							className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors dark:text-gray-400 dark:hover:bg-red-900/20"
							title="Remover"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
