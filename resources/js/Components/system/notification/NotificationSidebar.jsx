import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'react-toastify'
import BareButton from '@/Components/common/buttons/BareButton'
import NotificationItem from './NotificationItem'

function groupByDate(notifications) {
  const today    = new Date()
  const todayStr = today.toDateString()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  const groups = {}

  for (const n of notifications) {
    const d   = new Date(n.created_at)
    const str = d.toDateString()
    let label

    if (str === todayStr)           label = 'Hoje'
    else if (str === yesterdayStr)  label = 'Ontem'
    else label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  }

  return Object.entries(groups)
}

export default function NotificationSidebar({ open, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(false)
  const abortRef                          = useRef(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    abortRef.current?.abort()
    const controller  = new AbortController()
    abortRef.current  = controller

    setLoading(true)

    axios
      .get(route('notifications.index'), { signal: controller.signal })
      .then((res) => {
        if (!cancelled) setNotifications(res.data ?? [])
      })
      .catch((err) => {
        if (axios.isCancel(err) || err?.code === 'ERR_CANCELED') return
        console.error('Erro ao carregar notificações', err)
        toast.error('Não foi possível carregar as notificações.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await axios.post(route('notifications.mark-as-read', { notification: id }))
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
        ),
      )
    } catch {
      toast.error('Erro ao marcar notificação como lida.')
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await axios.post(route('notifications.mark-all-as-read'))
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at ?? new Date().toISOString() })),
      )
    } catch {
      toast.error('Não foi possível marcar as notificações como lidas.')
    }
  }, [])

  const handleClearAll = useCallback(async () => {
    try {
      await axios.delete(route('notifications.clear-all'))
      setNotifications([])
    } catch {
      toast.error('Não foi possível limpar as notificações.')
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const groups      = groupByDate(notifications)

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-end ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-modal={open}
      role="dialog"
      aria-label="Painel de notificações"
    >
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`relative flex h-full w-full max-w-sm flex-col bg-white dark:bg-[#0b0b0b] shadow-2xl ring-1 ring-black/10 dark:ring-white/5 transform transition-transform duration-300 ease-out sm:max-w-md ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Bell size={18} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notificações
            </h2>
            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} não lidas`}
                className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--theme-primary,theme(colors.rose.500))] px-1.5 text-[0.6rem] font-bold text-white"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <BareButton
                type="button"
                onClick={handleMarkAllAsRead}
                className="hidden sm:inline-flex rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Marcar todas como lidas
              </BareButton>
            )}
            {notifications.length > 0 && (
              <BareButton
                type="button"
                onClick={handleClearAll}
                className="hidden sm:inline-flex rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Limpar
              </BareButton>
            )}
            <BareButton
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Fechar painel de notificações"
            >
              <span className="text-base leading-none" aria-hidden="true">✕</span>
            </BareButton>
          </div>
        </header>

        {(unreadCount > 0 || notifications.length > 0) && (
          <div className="flex sm:hidden gap-2 border-b border-gray-100 dark:border-gray-800 px-4 py-2">
            {unreadCount > 0 && (
              <BareButton
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex-1 rounded-md py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                Marcar todas como lidas
              </BareButton>
            )}
            {notifications.length > 0 && (
              <BareButton
                type="button"
                onClick={handleClearAll}
                className="flex-1 rounded-md py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30"
              >
                Limpar tudo
              </BareButton>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-custom px-3 py-3">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400 dark:text-gray-600">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <p className="text-xs">Carregando…</p>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <BellOff size={40} className="text-gray-300 dark:text-gray-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nenhuma notificação
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-600">
                  Fique tranquilo, avisaremos quando algo precisar de atenção.
                </p>
              </div>
            </div>
          )}

          {!loading && groups.length > 0 && (
            <div className="space-y-5">
              {groups.map(([label, items]) => (
                <section key={label} aria-label={label}>
                  <p className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                    {label}
                  </p>
                  <ul className="space-y-2" role="list">
                    {items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <footer className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 text-center">
            <p className="text-[0.65rem] text-gray-400 dark:text-gray-600">
              {notifications.length} notificaç{notifications.length === 1 ? 'ão' : 'ões'} ·{' '}
              {unreadCount === 0 ? 'todas lidas' : `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`}
            </p>
          </footer>
        )}
      </aside>
    </div>
  )
}
