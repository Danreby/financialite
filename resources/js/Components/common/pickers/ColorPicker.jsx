import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PRESET_COLORS = [
  { name: 'Vermelho', hex: '#EF4444' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Roxo', hex: '#A855F7' },
  { name: 'Índigo', hex: '#6366F1' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Ciano', hex: '#06B6D4' },
  { name: 'Verde-água', hex: '#14B8A6' },
  { name: 'Verde', hex: '#22C55E' },
  { name: 'Lima', hex: '#84CC16' },
  { name: 'Amarelo', hex: '#EAB308' },
  { name: 'Laranja', hex: '#F97316' },
  { name: 'Marrom', hex: '#92400E' },
  { name: 'Cinza', hex: '#6B7280' },
  { name: 'Preto', hex: '#1F2937' },
]

export default function ColorPicker({ value, onChange, label = 'Cor', className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const colorInputRef = useRef(null)

  const selectedColorData = PRESET_COLORS.find(color => color.hex === value)
  const isCustomColor = value && !selectedColorData

  const handleSelectColor = (colorHex) => {
    onChange(colorHex)
    setIsOpen(false)
    setShowCustom(false)
  }

  const handleCustomColorClick = () => {
    setShowCustom(true)
    setTimeout(() => {
      colorInputRef.current?.click()
    }, 100)
  }

  const handleColorInputChange = (e) => {
    const newColor = e.target.value
    onChange(newColor)
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-[#0f0f0f] dark:hover:bg-gray-900/50"
      >
        <div className="flex items-center gap-3">
          {value ? (
            <>
              <div
                className="w-8 h-8 rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                style={{ backgroundColor: value }}
              />
              <div className="text-left">
                <span className="block text-sm text-gray-700 dark:text-gray-300">
                  {selectedColorData?.name || 'Cor customizada'}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {value}
                </span>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Selecione uma cor
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => {
                setIsOpen(false)
                setShowCustom(false)
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#0f0f0f] dark:border-gray-800"
            >
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Cores predefinidas
                </h3>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {PRESET_COLORS.map((color) => (
                    <motion.button
                      key={color.hex}
                      type="button"
                      onClick={() => handleSelectColor(color.hex)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`relative w-full aspect-square rounded-lg transition-all ${
                        value === color.hex
                          ? 'ring-2 ring-offset-2 ring-rose-500 dark:ring-offset-gray-900'
                          : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-400 dark:hover:ring-offset-gray-900'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {value === color.hex && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <svg
                            className="w-5 h-5 text-white drop-shadow-lg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}

                  <motion.button
                    type="button"
                    onClick={handleCustomColorClick}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`relative w-full aspect-square rounded-lg border-2 border-dashed transition-all ${
                      isCustomColor
                        ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-purple-50 dark:from-rose-900/20 dark:to-purple-900/20'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                    title="Selecionar cor customizada"
                  >
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-5 h-5 text-gray-500 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </motion.button>
                </div>

                {isCustomColor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50 mb-3"
                  >
                    <div
                      className="w-10 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: value }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Cor customizada
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{value}</p>
                    </div>
                  </motion.div>
                )}

                <input
                  ref={colorInputRef}
                  type="color"
                  value={value || '#000000'}
                  onChange={handleColorInputChange}
                  className="sr-only"
                />
              </div>

              {value && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null)
                      setIsOpen(false)
                      setShowCustom(false)
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Limpar seleção
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
