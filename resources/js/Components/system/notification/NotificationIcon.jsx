import React from 'react'
import { AlertTriangle, XCircle, CheckCircle, Info, Bell } from 'lucide-react'

const CONFIG = {
  warning: {
    Icon: AlertTriangle,
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    Icon: XCircle,
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
  },
  success: {
    Icon: CheckCircle,
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  info: {
    Icon: Info,
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
}

export default function NotificationIcon({ type = 'info', className = '' }) {
  const cfg = CONFIG[type] ?? CONFIG.info
  const { Icon } = cfg

  return (
    <span
      className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.text} ${className}`}
      aria-hidden="true"
    >
      <Icon size={15} strokeWidth={2} />
    </span>
  )
}
