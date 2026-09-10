import React from 'react'
import NavIcon from '@/Components/common/icons/NavIcon'

export default function ThemedNavIcon({ type, size = 16, className = '' }) {
  return (
    <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-150 ${className}`}>
      <NavIcon type={type} size={size} />
    </div>
  )
}
