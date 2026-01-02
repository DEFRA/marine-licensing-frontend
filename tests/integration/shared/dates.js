export const getThisYear = () => {
  return getFutureYear(0)
}

export const getNextYear = () => {
  return getFutureYear(1)
}

export const getFutureYear = (yearsToAdd) => {
  const today = new Date()
  return (today.getFullYear() + yearsToAdd).toString()
}

export const getToday = () => {
  const today = new Date()
  const day = today.getDate().toString()
  const month = (today.getMonth() + 1).toString()
  const year = today.getFullYear().toString()

  return { day, month, year }
}
