import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useTheme, THEMES } from '@/Contexts/ThemeContext'

export default function ThemeSettingsCard() {
  const { theme: currentTheme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)

  const handleSelectTheme = async (themeKey) => {
    if (themeKey === currentTheme || saving) return

    setSaving(true)
    try {
      await axios.patch(route('settings.theme'), { theme: themeKey })
      setTheme(themeKey)
      toast.success('Tema atualizado!')
    } catch {
      toast.error('Erro ao atualizar tema.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#0b0b0b] rounded-2xl shadow-md border border-gray-50/90 dark:border-[var(--theme-accent,theme(colors.rose.950/0.5))] ring-1 ring-black/5 dark:ring-black/30 p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" style={{ color: 'var(--theme-accent, #f43f5e)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Aparência
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Escolha o tema de cores que mais combina com você
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.values(THEMES).map((themeConfig) => {
          const isSelected = currentTheme === themeConfig.key

          return (
            <button
              key={themeConfig.key}
              type="button"
              onClick={() => handleSelectTheme(themeConfig.key)}
              disabled={saving}
              className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-current ring-2 shadow-lg scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
              } ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              style={isSelected ? {
                borderColor: themeConfig.colors.accent,
                ringColor: themeConfig.colors.primaryRing,
                boxShadow: `0 0 0 3px ${themeConfig.colors.primaryRing}`,
              } : {}}
            >
              {isSelected && (
                <div
                  className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeConfig.colors.accent }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{themeConfig.icon}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {themeConfig.label}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                {themeConfig.description}
              </p>

              <div className="flex items-center gap-1.5">
                <div
                  className="h-5 w-5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: themeConfig.colors.primary }}
                  title="Primária"
                />
                <div
                  className="h-5 w-5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: themeConfig.colors.accent }}
                  title="Acento"
                />
                <div
                  className="h-5 w-5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: themeConfig.colors.accentHover }}
                  title="Acento hover"
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
