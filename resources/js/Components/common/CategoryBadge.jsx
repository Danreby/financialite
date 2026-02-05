import React from 'react'

/**
 * Componente de badge para exibir categoria com ícone e cor
 * @param {Object} props
 * @param {string} props.name - Nome da categoria
 * @param {string} props.icon - Ícone da categoria (emoji ou nome)
 * @param {string} props.color - Cor da categoria em hexadecimal
 * @param {string} props.size - Tamanho do badge ('sm', 'md', 'lg')
 * @param {string} props.className - Classes CSS adicionais
 * @param {boolean} props.showIcon - Se deve mostrar o ícone (padrão: true)
 * @param {boolean} props.showDot - Se deve mostrar apenas um ponto colorido (padrão: false)
 */
export default function CategoryBadge({ 
  name, 
  icon, 
  color, 
  size = 'md',
  className = '',
  showIcon = true,
  showDot = false,
}) {
  // Se não tiver nome, não exibe nada
  if (!name) return null

  const displayName = name || 'Sem categoria'
  const hasColor = color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  const hasIcon = showIcon && icon

  // Tamanhos
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

  // Estilo base do badge
  const baseClasses = `inline-flex items-center rounded-full font-medium transition-colors ${sizeClasses[size] || sizeClasses.md}`

  // Se tem cor customizada
  if (hasColor) {
    return (
      <span
        className={`${baseClasses} ${className}`}
        style={{
          backgroundColor: `${color}15`, // 15 = ~8% opacity
          color: color,
          borderColor: `${color}40`, // 40 = ~25% opacity
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
            {icon}
          </span>
        )}
        <span className="truncate">{displayName}</span>
      </span>
    )
  }

  // Badge padrão sem cor
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
          {icon}
        </span>
      )}
      <span className="truncate">{displayName}</span>
    </span>
  )
}
