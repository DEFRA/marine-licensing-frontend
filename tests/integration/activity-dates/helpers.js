export const requestBody = ({ startDate, endDate } = {}) => {
  return {
    'activity-start-date-day': startDate?.day || '',
    'activity-start-date-month': startDate?.month || '',
    'activity-start-date-year': startDate?.year || '',
    'activity-end-date-day': endDate?.day || '',
    'activity-end-date-month': endDate?.month || '',
    'activity-end-date-year': endDate?.year || ''
  }
}
