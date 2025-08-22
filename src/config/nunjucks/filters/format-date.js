import { format, isDate, parseISO } from 'date-fns'

/**
 * @param {string | Date} value
 * @param {string} formattedDateStr
 */
export function formatDate(value, formattedDateStr = 'EEE do MMMM yyyy') {
  if (!value) {
    return ''
  }

  const date = isDate(value) ? value : parseISO(value)

  return format(date, formattedDateStr)
}
