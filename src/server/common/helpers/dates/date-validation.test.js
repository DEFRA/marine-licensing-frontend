import { validateActivityDates } from './date-validation.js'

describe('Date Validation - matching end-to-end test scenarios', () => {
  test('Error when no start date is entered', () => {
    const payload = {
      'activity-start-date-day': '',
      'activity-start-date-month': '',
      'activity-start-date-year': '',
      'activity-end-date-day': '01',
      'activity-end-date-month': '01',
      'activity-end-date-year': '2031'
    }

    const result = validateActivityDates(payload)

    expect(result.hasErrors).toBe(true)
    expect(result.errorSummary).toContainEqual({
      href: '#activity-start-date-day',
      text: 'Enter the start date'
    })
  })

  test('Error when start month is missing', () => {
    const payload = {
      'activity-start-date-day': '15',
      'activity-start-date-month': '',
      'activity-start-date-year': '2030',
      'activity-end-date-day': '01',
      'activity-end-date-month': '01',
      'activity-end-date-year': '2031'
    }

    const result = validateActivityDates(payload)

    expect(result.hasErrors).toBe(true)
    expect(result.errorSummary).toContainEqual({
      href: '#activity-start-date-month',
      text: 'The start date must include a month'
    })
  })

  test('Error when date is not valid (31/02/2030)', () => {
    const payload = {
      'activity-start-date-day': '31',
      'activity-start-date-month': '02',
      'activity-start-date-year': '2030',
      'activity-end-date-day': '01',
      'activity-end-date-month': '01',
      'activity-end-date-year': '2031'
    }

    const result = validateActivityDates(payload)

    expect(result.hasErrors).toBe(true)
    expect(result.errorSummary).toContainEqual({
      href: '#activity-start-date-day',
      text: 'The start date must be a real date'
    })
  })

  test('Error when start date is in the past', () => {
    const payload = {
      'activity-start-date-day': '18',
      'activity-start-date-month': '01',
      'activity-start-date-year': '2020',
      'activity-end-date-day': '01',
      'activity-end-date-month': '01',
      'activity-end-date-year': '2031'
    }

    const result = validateActivityDates(payload)

    expect(result.hasErrors).toBe(true)
    expect(result.errorSummary).toContainEqual({
      href: '#activity-start-date-day',
      text: 'The start date must be today or in the future'
    })
  })

  test('Error when end date is before start date', () => {
    const payload = {
      'activity-start-date-day': '15',
      'activity-start-date-month': '06',
      'activity-start-date-year': '2030',
      'activity-end-date-day': '14',
      'activity-end-date-month': '06',
      'activity-end-date-year': '2030'
    }

    const result = validateActivityDates(payload)

    expect(result.hasErrors).toBe(true)
    expect(result.errorSummary).toContainEqual({
      href: '#activity-end-date-day',
      text: 'The end date must be the same as or after the start date'
    })
  })

  test('Valid dates pass validation', () => {
    const payload = {
      'activity-start-date-day': '15',
      'activity-start-date-month': '06',
      'activity-start-date-year': '2030',
      'activity-end-date-day': '16',
      'activity-end-date-month': '06',
      'activity-end-date-year': '2030'
    }

    const result = validateActivityDates(payload)

    expect(result.hasErrors).toBe(false)
    expect(result.errorSummary).toEqual([])
  })
})
