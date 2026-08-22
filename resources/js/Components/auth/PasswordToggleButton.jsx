import React from 'react'
import { motion } from 'framer-motion'
import EyeIcon from '@/Components/common/icons/EyeIcon'

export default function PasswordToggleButton({
  visible,
  onToggle,
  labelShow = 'Mostrar senha',
  labelHide = 'Ocultar senha',
}) {
  const label = visible ? labelHide : labelShow

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors duration-150 hover:text-gray-200 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
      aria-label={label}
      title={label}
    >
      <EyeIcon open={visible} size={17} />
    </motion.button>
  )
}
