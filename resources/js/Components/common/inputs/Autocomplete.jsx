import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ScrollArea from '../ScrollArea'

export default function Autocomplete({
  options = [],
  value = '',
  onChange,
  onSelect,
  placeholder = 'Pesquisar...',
  labelKey = 'label',
  valueKey = 'value',
  name,
  disabled = false,
  error,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const dropdownRef = useRef(null)

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt[valueKey]) === String(value)),
    [options, value, valueKey]
  )

  useEffect(() => {
    if (selectedOption) {
      setSearch(selectedOption[labelKey] || '')
    } else {
      setSearch('')
    }
  }, [selectedOption, labelKey])

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const lower = search.toLowerCase()
    return options.filter((opt) =>
      String(opt[labelKey] || '').toLowerCase().includes(lower)
    )
  }, [options, search, labelKey])

  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updateDropdownPosition()

    const handleScrollOrResize = () => updateDropdownPosition()
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, updateDropdownPosition])

  useEffect(() => {
    const handler = (e) => {
      const clickedWrapper = wrapperRef.current?.contains(e.target)
      const clickedDropdown = dropdownRef.current?.contains(e.target)

      if (!clickedWrapper && !clickedDropdown) {
        setIsOpen(false)
        if (selectedOption) {
          setSearch(selectedOption[labelKey] || '')
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selectedOption, labelKey])

  useEffect(() => {
    setHighlightIndex(-1)
  }, [filtered])

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex]
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex])

  const handleSelect = useCallback(
    (opt) => {
      const val = String(opt[valueKey])
      setSearch(opt[labelKey] || '')
      setIsOpen(false)
      if (onChange) onChange(val)
      if (onSelect) onSelect(opt)
    },
    [onChange, onSelect, valueKey, labelKey]
  )

  const handleInputChange = (e) => {
    const val = e.target.value
    setSearch(val)
    setIsOpen(true)
    if (!val.trim() && onChange) onChange('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && filtered[highlightIndex]) {
        handleSelect(filtered[highlightIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      if (selectedOption) {
        setSearch(selectedOption[labelKey] || '')
      }
    }
  }

  const dropdownContent = (
    <AnimatePresence>
      <ScrollArea>
        {isOpen && filtered.length > 0 && (
          <motion.ul
            ref={(el) => {
              listRef.current = el
              dropdownRef.current = el
            }}
            role="listbox"
            style={dropdownStyle}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#0f0f0f]"
          >
            {filtered.map((opt, idx) => (
              <li
                key={opt[valueKey]}
                role="option"
                aria-selected={highlightIndex === idx}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors
                  ${highlightIndex === idx
                    ? 'bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                  ${String(opt[valueKey]) === String(value)
                    ? 'font-semibold'
                    : ''
                  }`}
              >
                {opt[labelKey]}
              </li>
            ))}
          </motion.ul>
        )}
      </ScrollArea>

      {isOpen && search.trim() && filtered.length === 0 && (
        <motion.div
          ref={dropdownRef}
          style={dropdownStyle}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-400"
        >
          Nenhum resultado encontrado
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value || ''} />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        autoComplete="off"
        value={search}
        onChange={handleInputChange}
        onFocus={() => {
          setSearch('')
          setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-md border bg-white p-2 text-sm shadow-sm transition-colors
          dark:bg-[#0f0f0f] dark:text-gray-100
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-700 focus:border-theme-accent focus:ring-theme-accent'
          }
          disabled:opacity-50 disabled:cursor-not-allowed`}
      />

      {createPortal(dropdownContent, document.body)}
    </div>
  )
}
