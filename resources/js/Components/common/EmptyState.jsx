export default function EmptyState({ icon, title, description }) {
	return (
		<div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
			<div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
				<span className="text-2xl sm:text-3xl">{icon}</span>
			</div>
			<h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
			<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
		</div>
	);
}
