import {
  mapDateDisplayedErrors,
  validateDateDisplayed
} from '#src/server/marine-licence/site-notice/date-displayed/utils.js'

const FIELD_DAY = 'date-displayed-day'
const now = new Date('2026-10-02T00:00:00.000Z')

const date = (day, month, year) => ({ day, month, year })

describe('#mapDateDisplayedErrors', () => {
  test('returns no errors when there are none', () => {
    expect(mapDateDisplayedErrors([])).toEqual([])
    expect(mapDateDisplayedErrors()).toEqual([])
  })

  test('returns a single required error when every part is missing', () => {
    const details = ['day', 'month', 'year'].map((part) => ({
      message: 'DATE_DISPLAYED_REQUIRED',
      path: [`date-displayed-${part}`]
    }))

    expect(mapDateDisplayedErrors(details)).toEqual([
      { message: 'DATE_DISPLAYED_REQUIRED', path: [FIELD_DAY] }
    ])
  })

  test('returns a single invalid error when only some parts are missing', () => {
    const details = [
      { message: 'DATE_DISPLAYED_REQUIRED', path: ['date-displayed-day'] },
      { message: 'DATE_DISPLAYED_DATE_INVALID', path: ['date-displayed-year'] }
    ]

    expect(mapDateDisplayedErrors(details)).toEqual([
      { message: 'DATE_DISPLAYED_DATE_INVALID', path: [FIELD_DAY] }
    ])
  })

  test('maps API errors onto the day field', () => {
    expect(
      mapDateDisplayedErrors([
        {
          message: 'DATE_DISPLAYED_DATE_TODAY_OR_PAST',
          path: ['dateDisplayed']
        }
      ])
    ).toEqual([
      { message: 'DATE_DISPLAYED_DATE_TODAY_OR_PAST', path: [FIELD_DAY] }
    ])

    expect(
      mapDateDisplayedErrors(
        ['DAY', 'MONTH', 'YEAR'].map((part) => ({
          message: `DATE_DISPLAYED_${part}_REQUIRED`,
          path: ['dateDisplayed', part.toLowerCase()]
        }))
      )
    ).toEqual([{ message: 'DATE_DISPLAYED_REQUIRED', path: [FIELD_DAY] }])
  })
})

describe('#validateDateDisplayed', () => {
  test('accepts today and past dates', () => {
    expect(validateDateDisplayed(date('2', '10', '2026'), now)).toEqual([])
    expect(validateDateDisplayed(date('01', '02', '2020'), now)).toEqual([])
  })

  test('rejects dates that do not exist', () => {
    expect(validateDateDisplayed(date('31', '2', '2026'), now)).toEqual([
      { message: 'DATE_DISPLAYED_DATE_INVALID', path: [FIELD_DAY] }
    ])
    expect(validateDateDisplayed(date('1', '13', '2026'), now)).toEqual([
      { message: 'DATE_DISPLAYED_DATE_INVALID', path: [FIELD_DAY] }
    ])
  })

  test('rejects future dates', () => {
    expect(validateDateDisplayed(date('3', '10', '2026'), now)).toEqual([
      { message: 'DATE_DISPLAYED_DATE_TODAY_OR_PAST', path: [FIELD_DAY] }
    ])
  })
})
