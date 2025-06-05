import { schema } from './date.js'

describe('Date Validator', () => {
  test('should return "Enter a start date" for no start date fields', () => {
    const result = schema.validate({
      'activity-start-date-day': '',
      'activity-start-date-month': '',
      'activity-start-date-year': ''
    })

    expect(result.error).toBeDefined()
    expect(result.error.message).toBe('Enter the start date')
  })

  test('should return "Enter an end date" for no end date fields', () => {
    const result = schema.validate({
      'activity-start-date-day': '01',
      'activity-start-date-month': '01',
      'activity-start-date-year': '2025',
      'activity-end-date-day': '',
      'activity-end-date-month': '',
      'activity-end-date-year': ''
    })

    expect(result.error).toBeDefined()
    expect(result.error.message).toBe('Enter the end date')
  })

  test.skip('should return error when single field is empty', () => {
    const result = schema.validate({
      'activity-start-date-day': '01',
      'activity-start-date-month': '',
      'activity-start-date-year': '2025',
      'activity-end-date-day': '31',
      'activity-end-date-month': '12',
      'activity-end-date-year': '2025'
    })

    expect(result.error).toBeDefined()
    expect(result.error.message).toBe('The start date must include a month')
  })

  test.skip('should stack multiple errors', () => {
    const result = schema.validate({
      'activity-start-date-day': '',
      'activity-start-date-month': '01',
      'activity-start-date-year': '',
      'activity-end-date-day': '',
      'activity-end-date-month': '12',
      'activity-end-date-year': ''
    })

    expect(result.error).toBeDefined()
    expect(result.error.message).toBe('The start date must include a day')
    expect(result.error.details).toContain('The start date must include a year')
    expect(result.error.details).toContain('The end date must include a day')
    expect(result.error.details).toContain('The end date must include a year')
    expect(result.error.details).toHaveLength(4)
  })

  test('should return error when start date is after end date', () => {
    const result = schema.validate({
      'activity-start-date-day': '02',
      'activity-start-date-month': '01',
      'activity-start-date-year': '2026',
      'activity-end-date-day': '01',
      'activity-end-date-month': '01',
      'activity-end-date-year': '2025'
    })

    expect(result.error).toBeDefined()
    expect(result.error.message).toBe(
      '[The end date must be the same as or after the start date]'
    ) // TODO: fix how errors are returned
  })

  test('should return an error when start date is before now', () => {
    jest.spyOn(Date, 'now').mockImplementation(() => 1749138476594) // 2025-06-05T10:01:16.594Z
    const result = schema.validate({
      'activity-start-date-day': '01',
      'activity-start-date-month': '01',
      'activity-start-date-year': '2024',
      'activity-end-date-day': '31',
      'activity-end-date-month': '12',
      'activity-end-date-year': '2027'
    })
    expect(result.error).toBeDefined()
    expect(result.error.message).toBe(
      '[The start date must be today or in the future]'
    ) // TODO: fix how errors are returned
    Date.now.mockRestore()
  })
})
