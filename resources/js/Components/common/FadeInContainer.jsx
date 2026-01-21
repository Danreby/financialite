import React from 'react'
import { motion } from 'framer-motion'
import { useFadeInAnimation } from '@/Hooks/useFadeInAnimation'

export default function FadeInContainer({
	children,
	className = '',
	variants = null,
	type = 'item',
	stagger = false,
	...props
}) {
	const animation = useFadeInAnimation()

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
