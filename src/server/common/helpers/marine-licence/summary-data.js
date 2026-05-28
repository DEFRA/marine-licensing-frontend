import dayjs from 'dayjs'

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

  return { ...marineLicence, preferredDates }
}
