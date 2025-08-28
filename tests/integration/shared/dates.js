export const getNextYear = () => {
  const today = new Date()
  return (today.getFullYear() + 1).toString()
}

export const getToday = () => {
  const today = new Date()
  const day = today.getDate().toString()
  const month = (today.getMonth() + 1).toString()
  const year = today.getFullYear().toString()

  return { day, month, year }
}
