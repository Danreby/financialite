import { useReducedMotion } from 'framer-motion'

export function useFadeInAnimation() {
	const reduceMotion = useReducedMotion()

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: reduceMotion
				? { duration: 0 }
				: { staggerChildren: 0.1, delayChildren: 0.2 },
		},
	}

	const itemVariants = {
		hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: reduceMotion ? 0 : 0.5, ease: 'easeOut' },
		},
	}

	const featureVariants = {
		hidden: { opacity: 0, scale: reduceMotion ? 1 : 0.95 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: { duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' },
		},
	}

	const fastItemVariants = {
		hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' },
		},
	}

	const subtleVariants = {
		hidden: { opacity: 0, y: reduceMotion ? 0 : 15 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' },
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
