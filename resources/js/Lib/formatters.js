/**
 * Formatadores centralizados para o projeto
 * @module formatters
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado em BRL (ex: "R$ 1.234,56")
 */
export function formatCurrencyBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0)
}

/**
 * Alias para formatCurrencyBRL (compatibilidade)
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado em BRL
 */
export const formatCurrency = formatCurrencyBRL

/**
 * Formata uma data para o padrão brasileiro
 * @param {string|Date} dateString - Data a ser formatada
 * @param {Object} options - Opções de formatação do Intl.DateTimeFormat
 * @returns {string} Data formatada (ex: "25 de jan. de 2025")
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(date)
}

/**
 * Formata uma data mostrando apenas dia e mês
 * @param {string|Date} dateString - Data a ser formatada
 * @returns {string} Data formatada (ex: "25 jan")
 */
export function formatDayLabel(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(date).replace('.', '')
}

/**
 * Formata data completa para exibição
 * @param {string|Date} dateString - Data a ser formatada
 * @returns {string} Data formatada (ex: "25/01/2025")
 */
export function formatDateBR(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

/**
 * Formata um valor como porcentagem
 * @param {number} value - Valor a ser formatado (0-1 ou 0-100)
 * @param {number} decimals - Casas decimais
 * @param {boolean} isDecimal - Se true, multiplica por 100
 * @returns {string} Valor formatado (ex: "45,5%")
 */
export function formatPercentage(value, decimals = 0, isDecimal = false) {
  const numValue = isDecimal ? (value * 100) : value
  return `${numValue.toFixed(decimals).replace('.', ',')}%`
}

/**
 * Formata tamanho de arquivo
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado (ex: "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let size = bytes
  
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  
  return `${size.toFixed(index > 0 ? 2 : 0)} ${units[index]}`
}

/**
 * Formata número com separadores de milhar
 * @param {number} value - Valor a ser formatado
 * @returns {string} Número formatado (ex: "1.234.567")
 */
export function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value || 0)
}
