/**
 * Hook customizado para fornecer variantes de animação fade-in reutilizáveis
 * Baseado na implementação da página About
 */
export function useFadeInAnimation() {
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2,
			},
		},
	}

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.5, ease: 'easeOut' },
		},
	}

	const featureVariants = {
		hidden: { opacity: 0, scale: 0.95 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: { duration: 0.4, ease: 'easeOut' },
		},
	}

	const fastItemVariants = {
		hidden: { opacity: 0, y: 10 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.3, ease: 'easeOut' },
		},
	}

	const subtleVariants = {
		hidden: { opacity: 0, y: 15 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.4, ease: 'easeOut' },
		},
	}

	return {
		containerVariants,
		itemVariants,
		featureVariants,
		fastItemVariants,
		subtleVariants,
	}
}
