import dayjs from 'dayjs'
import { invoicingReviewData } from './invoicing/invoicing-review-data.js'

const formatDate = (date) => {
  const { month, year } = date ?? {}
  return month && year ? dayjs(`${year}-${month}-01`).format('MMMM YYYY') : null
}

export const formatPreferredDates = (preferredDates) => {
  const { start, end } = preferredDates ?? {}

  const formattedStart = formatDate(start)
  const formattedEnd = formatDate(end)

  if (formattedStart && formattedEnd) {
    return `${formattedStart} to ${formattedEnd}`
  }

  return null
}

export const buildSummaryData = (marineLicence) => {
  const preferredDates = formatPreferredDates(marineLicence.preferredDates)
  const invoicing = invoicingReviewData(marineLicence.invoicing)
  return { ...marineLicence, preferredDates, invoicing }
}
