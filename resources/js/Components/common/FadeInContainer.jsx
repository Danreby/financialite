import React, { createContext, useContext, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useFadeInAnimation } from '@/Hooks/useFadeInAnimation'

/*
 * Entrada das telas (ver useFadeInAnimation): 200 ms, até 6 px, cascata só
 * nos 3 primeiros itens de cada contêiner, nada com prefers-reduced-motion.
 * Cada FadeInItem pega o próprio índice no contêiner mais próximo.
 */
const StaggerContext = createContext(null)

function pickVariants(animation, type) {
	switch (type) {
		case 'container':
			return animation.containerVariants
		case 'feature':
			return animation.featureVariants
		case 'fast':
			return animation.fastItemVariants
		case 'subtle':
			return animation.subtleVariants
		case 'item':
		default:
			return animation.itemVariants
	}
}

export default function FadeInContainer({
	children,
	className = '',
	variants = null,
	type = 'item',
	stagger = false,
	...props
}) {
	const animation = useFadeInAnimation()
	const counter = useRef(0)
	counter.current = 0

	const selectedVariants = variants || (stagger ? animation.containerVariants : pickVariants(animation, type))

	return (
		<StaggerContext.Provider value={stagger ? counter : null}>
			<motion.div
				className={className}
				variants={selectedVariants}
				initial="hidden"
				animate="visible"
				{...props}
			>
				{children}
			</motion.div>
		</StaggerContext.Provider>
	)
}

export function FadeInItem({ children, className = '', type = 'item', ...props }) {
	const animation = useFadeInAnimation()
	const counter = useContext(StaggerContext)
	const [index] = useState(() => (counter ? counter.current++ : 0))

	return (
		<motion.div className={className} variants={pickVariants(animation, type)} custom={index} {...props}>
			{children}
		</motion.div>
	)
}
