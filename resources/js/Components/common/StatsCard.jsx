export default function StatsCard({ icon, label, value, subText, colorClass }) {
	return (
		<div className="rounded-xl border border-gray-200/70 bg-white p-3 sm:p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
			<div className="flex items-center gap-3">
				<div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass || 'bg-theme-accent/10 dark:bg-theme-accent/20'}`}>
					<span className="text-base">{icon}</span>
				</div>
				<div className="min-w-0">
					<p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
					<p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">{value}</p>
					{subText && <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">{subText}</p>}
				</div>
			</div>
		</div>
	);
}
