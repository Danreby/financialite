import React from 'react'
import { getIconEmoji } from '@/Utils/categoryIcons'

export default function CategoryBadge({ 
  name, 
  icon, 
  color, 
  size = 'md',
  className = '',
  showIcon = true,
  showDot = false,
}) {
  if (!name) return null

  const displayName = name || 'Sem categoria'
  const hasColor = color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  const iconEmoji = icon ? getIconEmoji(icon) : null
  const hasIcon = showIcon && iconEmoji

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  const iconSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }

  const baseClasses = `inline-flex items-center rounded-full font-medium transition-colors ${sizeClasses[size] || sizeClasses.md}`

  if (hasColor) {
    // Detectar modo dark para ajustar opacidade
    const isDark = document.documentElement.classList.contains('dark')
    const bgOpacity = isDark ? '15' : '25'
    const borderOpacity = isDark ? '40' : '50'
    
    return (
      <span
        className={`${baseClasses} ${className}`}
        style={{
          backgroundColor: `${color}${bgOpacity}`,
          color: color,
          borderColor: `${color}${borderOpacity}`,
          borderWidth: '1px',
        }}
      >
        {showDot && (
          <span
            className={`rounded-full ${dotSizeClasses[size] || dotSizeClasses.md}`}
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        )}
        {hasIcon && !showDot && (
          <span className={iconSizeClasses[size] || iconSizeClasses.md} aria-hidden="true">
            {iconEmoji}
          </span>
        )}
        <span className="truncate">{displayName}</span>
      </span>
    )
  }

  return (
    <span
      className={`${baseClasses} bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full bg-gray-400 dark:bg-gray-600 ${dotSizeClasses[size] || dotSizeClasses.md}`}
          aria-hidden="true"
        />
      )}
      {hasIcon && !showDot && (
        <span className={iconSizeClasses[size] || iconSizeClasses.md} aria-hidden="true">
          {iconEmoji}
        </span>
      )}
      <span className="truncate">{displayName}</span>
    </span>
  )
}
