export function sanitizeString(str) {
  if (typeof str !== 'string') return ''
  
  return str
    .trim()
    .replace(/[<>'"]/g, '')
    .substring(0, 255)
}

export function sanitizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) return null
  
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  
  const minDate = new Date()
  minDate.setFullYear(minDate.getFullYear() - 10)
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1)
  
  if (date < minDate || date > maxDate) return null
  
  return dateStr
}

export function sanitizeId(id) {
  if (!id) return null
  
  const numId = typeof id === 'string' ? parseInt(id, 10) : id
  
  if (Number.isNaN(numId) || numId <= 0 || numId > 2147483647) {
    return null
  }
  
  return numId
}

export function sanitizeTransactionType(type) {
  if (!type || typeof type !== 'string') return null
  
  const validTypes = ['debit', 'credit']
  const normalizedType = type.toLowerCase().trim()
  
  return validTypes.includes(normalizedType) ? normalizedType : null
}

export function sanitizeFilterParams(params) {
  const sanitized = {}
  
  if (params.start_date) {
    const startDate = sanitizeDate(params.start_date)
    if (startDate) sanitized.start_date = startDate
  }
  
  if (params.end_date) {
    const endDate = sanitizeDate(params.end_date)
    if (endDate) sanitized.end_date = endDate
  }
  
  if (params.bank_user_id) {
    const bankId = sanitizeId(params.bank_user_id)
    if (bankId) sanitized.bank_user_id = bankId
  }
  
  if (params.category_id) {
    const categoryId = sanitizeId(params.category_id)
    if (categoryId) sanitized.category_id = categoryId
  }
  
  if (params.type) {
    const type = sanitizeTransactionType(params.type)
    if (type) sanitized.type = type
  }
  
  return sanitized
}

export function escapeHtml(text) {
  if (typeof text !== 'string') return ''
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

export function sanitizeCurrencyValue(value) {
  if (value === null || value === undefined) return null
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (Number.isNaN(numValue) || !Number.isFinite(numValue)) {
    return null
  }
  
  if (numValue < -1000000000 || numValue > 1000000000) {
    return null
  }
  
  return numValue
}
