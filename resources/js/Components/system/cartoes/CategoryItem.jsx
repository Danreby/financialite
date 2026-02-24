import { motion } from 'framer-motion';
import CategoryBadge from '@/Components/common/CategoryBadge';

export default function CategoryItem({ category, onEdit, onDelete, saving }) {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={{ duration: 0.2 }}
			className="group flex items-center gap-3 rounded-xl border border-gray-200/70 bg-white p-3 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900/80"
		>
			<CategoryBadge icon={category.icon} color={category.color} size="md" />

			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
					{category.name}
				</p>
			</div>

			<div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
				<button
					type="button"
					onClick={() => onEdit(category)}
					disabled={saving}
					className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:text-theme-accent hover:bg-theme-accent/10 transition-colors dark:text-gray-400"
					title="Editar categoria"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
					</svg>
				</button>
				<button
					type="button"
					onClick={() => onDelete({ categoryId: category.id, name: category.name })}
					disabled={saving}
					className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors dark:text-gray-400 dark:hover:bg-red-900/20"
					title="Remover categoria"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
					</svg>
				</button>
			</div>
		</motion.div>
	);
}
