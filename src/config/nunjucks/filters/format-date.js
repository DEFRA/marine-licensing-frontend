import { format, isDate, parseISO } from 'date-fns'
export function formatDate(value, formattedDateStr = 'EEE do MMMM yyyy') {
  if (!value) {
    return ''
  }

  const date = isDate(value) ? value : parseISO(value)

  return format(date, formattedDateStr)
}
