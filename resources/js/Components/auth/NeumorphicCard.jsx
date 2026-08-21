import React from 'react'

export default function NeumorphicCard({ children, className = '' }) {
  return (
    <div className={`neu-surface neu-outset rounded-[2rem] px-6 pt-10 pb-8 sm:px-8 ${className}`}>
      {children}
    </div>
  )
}
