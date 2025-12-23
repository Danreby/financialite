import React from 'react'

export default function BareButton({ type = 'button', className = '', children, ...props }) {
  return (
    <button
      type={type}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}
