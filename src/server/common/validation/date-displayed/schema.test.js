import { dateDisplayedSchema } from '#src/server/common/validation/date-displayed/schema.js'

const validate = (day, month, year) =>
  dateDisplayedSchema.validate(
    {
      'date-displayed-day': day,
      'date-displayed-month': month,
      'date-displayed-year': year
    },
    { abortEarly: false }
  )

const messagesFor = (error) =>
  error.details.map(({ message, path }) => [path[0], message])

describe('dateDisplayedSchema', () => {
  test('passes with a valid date', () => {
    expect(validate('15', '3', '2026').error).toBeUndefined()
  })

  test('passes with leading zeros', () => {
    expect(validate('05', '03', '2026').error).toBeUndefined()
  })

  test('fails on every part when all parts are empty', () => {
    expect(messagesFor(validate('', '', '').error)).toEqual([
      ['date-displayed-day', 'DATE_DISPLAYED_REQUIRED'],
      ['date-displayed-month', 'DATE_DISPLAYED_REQUIRED'],
      ['date-displayed-year', 'DATE_DISPLAYED_REQUIRED']
    ])
  })

  test('fails when parts are missing', () => {
    const { error } = dateDisplayedSchema.validate({}, { abortEarly: false })

    expect(error.details.map(({ message }) => message)).toEqual([
      'DATE_DISPLAYED_REQUIRED',
      'DATE_DISPLAYED_REQUIRED',
      'DATE_DISPLAYED_REQUIRED'
    ])
  })

  test.each([
    ['letters in the day', 'ab', '3', '2026', 'date-displayed-day'],
    ['a three digit day', '123', '3', '2026', 'date-displayed-day'],
    ['letters in the month', '15', 'March', '2026', 'date-displayed-month'],
    ['a two digit year', '15', '3', '26', 'date-displayed-year'],
    ['a five digit year', '15', '3', '20266', 'date-displayed-year']
  ])('fails with %s', (_, day, month, year, field) => {
    expect(messagesFor(validate(day, month, year).error)).toEqual([
      [field, 'DATE_DISPLAYED_DATE_INVALID']
    ])
  })
})
