import React from 'react'
import { Link } from '@inertiajs/react'
import ArrowIcon from '@/Components/common/icons/ArrowIcon'

function decodeHtmlEntities(html) {
  if (!html || typeof html !== 'string') return ''
  
  return html
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
}

export default function Pagination({ links = [] }) {
  if (!links || links.length <= 1) return null

  return (
    <nav className="mt-4 flex justify-center" aria-label="Navegação de páginas">
      <ul className="inline-flex items-center gap-1 text-xs">
        {links.map((link, index) => {
          const key = `${link.label ?? index}-${index}`

          const isFirst = index === 0
          const isLast = index === links.length - 1
          
          const safeLabel = decodeHtmlEntities(link.label)

          if (!link.url) {
            return (
              <li key={key}>
                <span 
                  className="px-2.5 py-1 rounded border border-transparent text-gray-400 dark:text-gray-600 inline-flex items-center justify-center"
                  aria-disabled="true"
                >
                  {isFirst && <ArrowIcon type="left" size={14} aria-hidden="true" />}
                  {isLast && <ArrowIcon type="right" size={14} aria-hidden="true" />}
                  {!isFirst && !isLast && <span>{safeLabel}</span>}
                </span>
              </li>
            )
          }

          const isActive = link.active

          return (
            <li key={key}>
              <Link
                href={link.url}
                preserveScroll
                preserveState
                aria-current={isActive ? 'page' : undefined}
                aria-label={isFirst ? 'Página anterior' : isLast ? 'Próxima página' : `Página ${safeLabel}`}
                className={
                  isActive
                    ? 'px-2.5 py-1 rounded border border-rose-500 bg-rose-500 text-white shadow-sm'
                    : 'px-2.5 py-1 rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-[#111] dark:text-gray-200 dark:hover:bg-gray-800'
                }
              >
                <span className="inline-flex items-center justify-center gap-1">
                  {isFirst && <ArrowIcon type="left" size={14} aria-hidden="true" />}
                  {isLast && <ArrowIcon type="right" size={14} aria-hidden="true" />}
                  {!isFirst && !isLast && <span>{safeLabel}</span>}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
