import React, { useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'

const AUTH_FLOW_ORDER = ['Auth/Login', 'Auth/Register']

function usePrevious(value) {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

const variants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction * 36,
    scale: 0.97,
    filter: 'blur(6px)',
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction === 0 ? 0 : -direction * 36,
    scale: 0.97,
    filter: 'blur(6px)',
    transition: { duration: 0.26, ease: [0.4, 0, 1, 1] },
  }),
}

export default function GuestLayout({ children, bgClassName = 'bg-surface-base text-content-primary' }) {
  const { component } = usePage()
  const previousComponent = usePrevious(component)

  const prevIndex = AUTH_FLOW_ORDER.indexOf(previousComponent)
  const currentIndex = AUTH_FLOW_ORDER.indexOf(component)
  const direction = prevIndex !== -1 && currentIndex !== -1 ? Math.sign(currentIndex - prevIndex) : 0

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgClassName}`}>
      <div className="w-full px-6 sm:px-0">
        <div className="flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={component}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex items-center justify-center"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
