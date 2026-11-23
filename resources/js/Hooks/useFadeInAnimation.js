import { useReducedMotion } from 'framer-motion'

/*
 * Entrada das telas: rápida e discreta. O conteúdo fica legível em até
 * 200 ms (opacidade + no máximo 6 px de deslocamento, ease-out exponencial).
 * A cascata só atrasa os 3 primeiros itens (ver FadeInContainer); o resto
 * entra junto. Com prefers-reduced-motion, nada anima.
 */
export const FADE_DURATION = 0.2
export const FADE_EASE = [0.16, 1, 0.3, 1]
export const STAGGER_STEP = 0.04
export const STAGGER_MAX_ITEMS = 3

/** Atraso do item na cascata: 0, 40, 80 ms e depois todos juntos. */
export function staggerDelay(index) {
	if (index == null || index < 0) return 0
	return Math.min(index, STAGGER_MAX_ITEMS - 1) * STAGGER_STEP
}

export function useFadeInAnimation() {
	const reduceMotion = useReducedMotion()

	const still = { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { duration: 0 } } }

	const make = (offset) =>
		reduceMotion
			? still
			: {
					hidden: { opacity: 0, y: offset },
					visible: (index) => ({
						opacity: 1,
						y: 0,
						transition: { duration: FADE_DURATION, ease: FADE_EASE, delay: staggerDelay(index) },
					}),
				}

	// O contêiner não esconde nada: só propaga hidden → visible aos filhos.
	const containerVariants = { hidden: {}, visible: {} }

	const itemVariants = make(6)
	const fastItemVariants = make(4)
	const subtleVariants = make(4)
	const featureVariants = reduceMotion
		? still
		: {
				hidden: { opacity: 0, scale: 0.99 },
				visible: (index) => ({
					opacity: 1,
					scale: 1,
					transition: { duration: FADE_DURATION, ease: FADE_EASE, delay: staggerDelay(index) },
				}),
			}

	return {
		containerVariants,
		itemVariants,
		featureVariants,
		fastItemVariants,
		subtleVariants,
	}
}
