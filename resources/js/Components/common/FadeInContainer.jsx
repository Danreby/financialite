import React from 'react'
import { motion } from 'framer-motion'
import { useFadeInAnimation } from '@/Hooks/useFadeInAnimation'

/**
 * Componente wrapper que aplica animação fade-in em seus filhos
 * @param {Object} props
 * @param {React.ReactNode} props.children - Elementos filhos
 * @param {string} props.className - Classes CSS adicionais
 * @param {Object} props.variants - Variantes customizadas (opcional)
 * @param {string} props.type - Tipo de animação: 'container', 'item', 'feature', 'fast', 'subtle'
 * @param {boolean} props.stagger - Se true, aplica stagger aos filhos
 */
export default function FadeInContainer({
	children,
	className = '',
	variants = null,
	type = 'item',
	stagger = false,
	...props
}) {
	const animation = useFadeInAnimation()

	// Seleciona as variantes baseado no tipo
	const getVariants = () => {
		if (variants) return variants
		
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

	const selectedVariants = stagger ? animation.containerVariants : getVariants()

	return (
		<motion.div
			className={className}
			variants={selectedVariants}
			initial="hidden"
			animate="visible"
			{...props}
		>
			{children}
		</motion.div>
	)
}

/**
 * Componente para itens dentro de um container com stagger
 */
export function FadeInItem({ children, className = '', type = 'item', ...props }) {
	const animation = useFadeInAnimation()

	const getVariants = () => {
		switch (type) {
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

	return (
		<motion.div className={className} variants={getVariants()} {...props}>
			{children}
		</motion.div>
	)
}
