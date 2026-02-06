import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ICON_CATEGORIES = {
  'Alimentação': [
    { name: 'utensils', label: 'Talheres', icon: '🍴' },
    { name: 'coffee', label: 'Café', icon: '☕' },
    { name: 'pizza', label: 'Pizza', icon: '🍕' },
    { name: 'hamburger', label: 'Hambúrguer', icon: '🍔' },
    { name: 'beer', label: 'Cerveja', icon: '🍺' },
    { name: 'cake', label: 'Bolo', icon: '🍰' },
  ],
  'Transporte': [
    { name: 'car', label: 'Carro', icon: '🚗' },
    { name: 'bus', label: 'Ônibus', icon: '🚌' },
    { name: 'train', label: 'Trem', icon: '🚆' },
    { name: 'plane', label: 'Avião', icon: '✈️' },
    { name: 'bicycle', label: 'Bicicleta', icon: '🚲' },
    { name: 'fuel', label: 'Combustível', icon: '⛽' },
  ],
  'Moradia': [
    { name: 'home', label: 'Casa', icon: '🏠' },
    { name: 'bed', label: 'Cama', icon: '🛏️' },
    { name: 'couch', label: 'Sofá', icon: '🛋️' },
    { name: 'bulb', label: 'Lâmpada', icon: '💡' },
    { name: 'key', label: 'Chave', icon: '🔑' },
    { name: 'tools', label: 'Ferramentas', icon: '🔧' },
  ],
  'Saúde': [
    { name: 'heart', label: 'Coração', icon: '❤️' },
    { name: 'medical', label: 'Médico', icon: '🏥' },
    { name: 'pill', label: 'Remédio', icon: '💊' },
    { name: 'dumbbell', label: 'Academia', icon: '🏋️' },
    { name: 'apple', label: 'Maçã', icon: '🍎' },
    { name: 'tooth', label: 'Dente', icon: '🦷' },
  ],
  'Educação': [
    { name: 'book', label: 'Livro', icon: '📚' },
    { name: 'graduation', label: 'Formatura', icon: '🎓' },
    { name: 'pencil', label: 'Lápis', icon: '✏️' },
    { name: 'backpack', label: 'Mochila', icon: '🎒' },
    { name: 'computer', label: 'Computador', icon: '💻' },
    { name: 'microscope', label: 'Microscópio', icon: '🔬' },
  ],
  'Lazer': [
    { name: 'game', label: 'Jogo', icon: '🎮' },
    { name: 'music', label: 'Música', icon: '🎵' },
    { name: 'movie', label: 'Filme', icon: '🎬' },
    { name: 'camera', label: 'Câmera', icon: '📷' },
    { name: 'ball', label: 'Bola', icon: '⚽' },
    { name: 'gift', label: 'Presente', icon: '🎁' },
  ],
  'Finanças': [
    { name: 'dollar', label: 'Dinheiro', icon: '💰' },
    { name: 'credit-card', label: 'Cartão', icon: '💳' },
    { name: 'wallet', label: 'Carteira', icon: '👛' },
    { name: 'bank', label: 'Banco', icon: '🏦' },
    { name: 'chart', label: 'Gráfico', icon: '📊' },
    { name: 'piggy', label: 'Porquinho', icon: '🐷' },
  ],
  'Outros': [
    { name: 'shopping', label: 'Compras', icon: '🛒' },
    { name: 'shopping-online', label: 'Compras Online', icon: '🛍️' },
    { name: 'phone', label: 'Telefone', icon: '📱' },
    { name: 'shirt', label: 'Roupa', icon: '👕' },
    { name: 'paw', label: 'Pet', icon: '🐾' },
    { name: 'scissors', label: 'Tesoura', icon: '✂️' },
    { name: 'umbrella', label: 'Guarda-chuva', icon: '☂️' },
  ],
}

export default function IconPicker({ value, onChange, label = 'Ícone', className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Alimentação')
  const [searchTerm, setSearchTerm] = useState('')

  const allIcons = Object.values(ICON_CATEGORIES).flat()
  const selectedIconData = allIcons.find(icon => icon.name === value)

  const filteredIcons = searchTerm
    ? allIcons.filter(icon => 
        icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        icon.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ICON_CATEGORIES[activeCategory]

  const handleSelectIcon = (iconName) => {
    onChange(iconName)
    setIsOpen(false)
    setSearchTerm('')
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
          {selectedIconData ? (
            <>
              <span className="text-2xl">{selectedIconData.icon}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {selectedIconData.label}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Selecione um ícone
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
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#0f0f0f] dark:border-gray-800"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar ícone..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 themed-focus dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  autoFocus
                />
              </div>

              {!searchTerm && (
                <div className="flex gap-1 px-4 py-3 overflow-x-auto border-b border-gray-200 dark:border-gray-800 scrollbar-thin">
                  {Object.keys(ICON_CATEGORIES).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                        activeCategory === category
                          ? 'themed-pill-active'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4 max-h-80 overflow-y-auto scrollbar-thin">
                {filteredIcons && filteredIcons.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {filteredIcons.map((icon) => (
                      <motion.button
                        key={icon.name}
                        type="button"
                        onClick={() => handleSelectIcon(icon.name)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-colors ${
                          value === icon.name
                            ? 'bg-theme-accent-light ring-2 ring-theme-accent dark:bg-theme-primary-light'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title={icon.label}
                      >
                        <span className="text-2xl">{icon.icon}</span>
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center leading-tight">
                          {icon.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    Nenhum ícone encontrado
                  </p>
                )}
              </div>

              {value && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null)
                      setIsOpen(false)
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
