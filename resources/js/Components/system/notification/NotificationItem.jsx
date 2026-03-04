import React from 'react'
import NotificationIcon from './NotificationIcon'

const MINUTE = 60
const HOUR   = 3600
const DAY    = 86400
const WEEK   = 604800
const MONTH  = 2592000

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (diff < 60)       return 'agora mesmo'
    if (diff < HOUR)     return `há ${Math.floor(diff / MINUTE)} min`
    if (diff < DAY)      return `há ${Math.floor(diff / HOUR)}h`
    if (diff < WEEK)     return `há ${Math.floor(diff / DAY)} dia${Math.floor(diff / DAY) > 1 ? 's' : ''}`
    if (diff < MONTH)    return `há ${Math.floor(diff / WEEK)} semana${Math.floor(diff / WEEK) > 1 ? 's' : ''}`
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return ''
  }
}

const TYPE_BORDER = {
  warning: 'border-l-amber-400 dark:border-l-amber-500',
  error:   'border-l-red-400 dark:border-l-red-500',
  success: 'border-l-emerald-400 dark:border-l-emerald-500',
  info:    'border-l-blue-400 dark:border-l-blue-500',
}

export default function NotificationItem({ notification, onMarkAsRead }) {
  const isUnread = !notification.is_read
  const borderColor = TYPE_BORDER[notification.type] ?? TYPE_BORDER.info

  const handleClick = () => {
    if (isUnread && typeof onMarkAsRead === 'function') {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <li
      role={isUnread ? 'button' : undefined}
      tabIndex={isUnread ? 0 : undefined}
      aria-label={isUnread ? 'Marcar notificação como lida' : undefined}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={[
        'flex items-start gap-3 rounded-lg border-l-4 px-3 py-2.5',
        'transition-colors duration-150',
        borderColor,
        isUnread
          ? 'cursor-pointer bg-white shadow-sm hover:bg-gray-50 dark:bg-[#111] dark:hover:bg-[#191919]'
          : 'bg-gray-50/60 dark:bg-[#0e0e0e] opacity-70',
        'border border-gray-100 dark:border-gray-800/60',
      ].join(' ')}
    >
      <NotificationIcon type={notification.type} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-[0.75rem] font-semibold leading-snug ${
              isUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {notification.title}
          </p>
          {isUnread && (
            <span
              aria-label="Não lida"
              className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--theme-primary,theme(colors.rose.500))]"
            />
          )}
        </div>

        {notification.message && (
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-gray-500 dark:text-gray-400">
            {notification.message}
          </p>
        )}

        <p className="mt-1 text-[0.63rem] text-gray-400 dark:text-gray-600">
          {formatRelativeTime(notification.created_at)}
          {isUnread && (
            <span className="ml-1 text-[0.63rem] text-[var(--theme-primary,theme(colors.rose.500))] opacity-70">
              · toque para marcar como lida
            </span>
          )}
        </p>
      </div>
    </li>
  )
}
