import {
  mapPreferredDatesErrors,
  validateDateRanges
} from '#src/server/marine-licence/preferred-dates/utils.js'

describe('#mapPreferredDatesErrors', () => {
  test('should return empty array for empty input', () => {
    expect(mapPreferredDatesErrors([])).toEqual([])
  })

  test('should return empty array for non-array input', () => {
    expect(mapPreferredDatesErrors(null)).toEqual([])
  })

  test('should produce PREFERRED_START_DATE_REQUIRED when both start fields are missing', () => {
    const details = [
      { message: 'PREFERRED_START_MONTH_REQUIRED', path: ['start-date-month'] },
      { message: 'PREFERRED_START_YEAR_REQUIRED', path: ['start-date-year'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual([
      { message: 'PREFERRED_START_DATE_REQUIRED', path: ['start-date-month'] }
    ])
  })

  test('should produce PREFERRED_END_DATE_REQUIRED when both end fields are missing', () => {
    const details = [
      { message: 'PREFERRED_END_MONTH_REQUIRED', path: ['end-date-month'] },
      { message: 'PREFERRED_END_YEAR_REQUIRED', path: ['end-date-year'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual([
      { message: 'PREFERRED_END_DATE_REQUIRED', path: ['end-date-month'] }
    ])
  })

  test('should produce PREFERRED_START_DATE_REQUIRED and PREFERRED_END_DATE_REQUIRED when all four fields are missing', () => {
    const details = [
      { message: 'PREFERRED_START_MONTH_REQUIRED', path: ['start-date-month'] },
      { message: 'PREFERRED_START_YEAR_REQUIRED', path: ['start-date-year'] },
      { message: 'PREFERRED_END_MONTH_REQUIRED', path: ['end-date-month'] },
      { message: 'PREFERRED_END_YEAR_REQUIRED', path: ['end-date-year'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual([
      { message: 'PREFERRED_START_DATE_REQUIRED', path: ['start-date-month'] },
      { message: 'PREFERRED_END_DATE_REQUIRED', path: ['end-date-month'] }
    ])
  })

  test('should keep PREFERRED_START_MONTH_REQUIRED with correct path when only start month is missing', () => {
    const details = [
      { message: 'PREFERRED_START_MONTH_REQUIRED', path: ['start-date-month'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual([
      { message: 'PREFERRED_START_MONTH_REQUIRED', path: ['start-date-month'] }
    ])
  })

  test('should keep PREFERRED_START_YEAR_REQUIRED with correct path when only start year is missing', () => {
    const details = [
      { message: 'PREFERRED_START_YEAR_REQUIRED', path: ['start-date-year'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual([
      { message: 'PREFERRED_START_YEAR_REQUIRED', path: ['start-date-year'] }
    ])
  })

  test('should keep PREFERRED_END_MONTH_REQUIRED with correct path when only end month is missing', () => {
    const details = [
      { message: 'PREFERRED_END_MONTH_REQUIRED', path: ['end-date-month'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual([
      { message: 'PREFERRED_END_MONTH_REQUIRED', path: ['end-date-month'] }
    ])
  })

  test('should keep PREFERRED_END_YEAR_REQUIRED with correct path when only end year is missing', () => {
    const details = [
      { message: 'PREFERRED_END_YEAR_REQUIRED', path: ['end-date-year'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual([
      { message: 'PREFERRED_END_YEAR_REQUIRED', path: ['end-date-year'] }
    ])
  })

  test('should preserve unrelated errors', () => {
    const details = [
      { message: 'SOME_OTHER_ERROR', path: ['other-field'] },
      { message: 'PREFERRED_START_MONTH_REQUIRED', path: ['start-date-month'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual([
      { message: 'PREFERRED_START_MONTH_REQUIRED', path: ['start-date-month'] },
      { message: 'SOME_OTHER_ERROR', path: ['other-field'] }
    ])
  })

  test('should pass invalid format errors through unchanged', () => {
    const details = [
      { message: 'PREFERRED_START_MONTH_INVALID', path: ['start-date-month'] },
      { message: 'PREFERRED_END_YEAR_INVALID', path: ['end-date-year'] }
    ]
    const result = mapPreferredDatesErrors(details)
    expect(result).toEqual(details)
  })
})

describe('#validateDateRanges', () => {
  const MAY_2026 = new Date(2026, 4, 1)

  const payload = (startMonth, startYear, endMonth, endYear) => ({
    'start-date-month': startMonth,
    'start-date-year': startYear,
    'end-date-month': endMonth,
    'end-date-year': endYear
  })

  test('should return empty array when both dates are in the future', () => {
    const result = validateDateRanges(
      payload('6', '2026', '12', '2027'),
      MAY_2026
    )
    expect(result).toEqual([])
  })

  test('should return empty array when both dates are the current month', () => {
    const result = validateDateRanges(
      payload('5', '2026', '5', '2026'),
      MAY_2026
    )
    expect(result).toEqual([])
  })

  test('should treat the current month as valid when now is mid-month', () => {
    const MAY_22 = new Date(2026, 4, 22)
    const result = validateDateRanges(
      payload('5', '2026', '12', '2027'),
      MAY_22
    )
    expect(result).toEqual([])
  })

  test('should return PREFERRED_START_DATE_TODAY_OR_FUTURE when start month is in the past', () => {
    const result = validateDateRanges(
      payload('4', '2026', '12', '2027'),
      MAY_2026
    )
    expect(result).toEqual([
      {
        message: 'PREFERRED_START_DATE_TODAY_OR_FUTURE',
        path: ['start-date-month']
      }
    ])
  })

  test('should return PREFERRED_START_DATE_TODAY_OR_FUTURE when start year is in the past', () => {
    const result = validateDateRanges(
      payload('12', '2025', '12', '2027'),
      MAY_2026
    )
    expect(result).toEqual([
      {
        message: 'PREFERRED_START_DATE_TODAY_OR_FUTURE',
        path: ['start-date-month']
      }
    ])
  })

  test('should return PREFERRED_END_DATE_TODAY_OR_FUTURE when end month is in the past', () => {
    const result = validateDateRanges(
      payload('6', '2026', '4', '2026'),
      MAY_2026
    )
    expect(result).toEqual([
      {
        message: 'PREFERRED_END_DATE_TODAY_OR_FUTURE',
        path: ['end-date-month']
      }
    ])
  })

  test('should return PREFERRED_END_DATE_TODAY_OR_FUTURE when end year is in the past', () => {
    const result = validateDateRanges(
      payload('6', '2026', '12', '2025'),
      MAY_2026
    )
    expect(result).toEqual([
      {
        message: 'PREFERRED_END_DATE_TODAY_OR_FUTURE',
        path: ['end-date-month']
      }
    ])
  })

  test('should return both errors when both dates are in the past', () => {
    const result = validateDateRanges(
      payload('1', '2020', '2', '2020'),
      MAY_2026
    )
    expect(result).toEqual([
      {
        message: 'PREFERRED_START_DATE_TODAY_OR_FUTURE',
        path: ['start-date-month']
      },
      {
        message: 'PREFERRED_END_DATE_TODAY_OR_FUTURE',
        path: ['end-date-month']
      }
    ])
  })

  test('should return PREFERRED_END_DATE_BEFORE_START_DATE when end is before start', () => {
    const result = validateDateRanges(
      payload('8', '2026', '7', '2026'),
      MAY_2026
    )
    expect(result).toEqual([
      {
        message: 'PREFERRED_END_DATE_BEFORE_START_DATE',
        path: ['end-date-month']
      }
    ])
  })

  test('should return PREFERRED_END_DATE_BEFORE_START_DATE when end year is before start year', () => {
    const result = validateDateRanges(
      payload('1', '2027', '12', '2026'),
      MAY_2026
    )
    expect(result).toEqual([
      {
        message: 'PREFERRED_END_DATE_BEFORE_START_DATE',
        path: ['end-date-month']
      }
    ])
  })

  test('should not return end-before-start error when start and end are the same month', () => {
    const result = validateDateRanges(
      payload('8', '2026', '8', '2026'),
      MAY_2026
    )
    expect(result).toEqual([])
  })

  test('should not return end-before-start error when past-date errors already exist', () => {
    const result = validateDateRanges(
      payload('1', '2020', '12', '2019'),
      MAY_2026
    )
    expect(result).not.toContainEqual({
      message: 'PREFERRED_END_DATE_BEFORE_START_DATE',
      path: ['end-date-month']
    })
  })
})
