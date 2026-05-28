import { preferredDatesSchema } from '#src/server/marine-licence/preferred-dates/schema.js'

const validPayload = {
  'start-date-month': '7',
  'start-date-year': '2026',
  'end-date-month': '8',
  'end-date-year': '2027'
}

describe('#preferredDatesSchema', () => {
  test('should validate when all fields are present', () => {
    const { error } = preferredDatesSchema.validate(validPayload)
    expect(error).toBeUndefined()
  })

  test('should fail with PREFERRED_START_MONTH_REQUIRED when start month is empty', () => {
    const { error } = preferredDatesSchema.validate(
      { ...validPayload, 'start-date-month': '' },
      { abortEarly: false }
    )
    expect(error.details[0].message).toBe('PREFERRED_START_MONTH_REQUIRED')
  })

  test('should fail with PREFERRED_START_YEAR_REQUIRED when start year is empty', () => {
    const { error } = preferredDatesSchema.validate(
      { ...validPayload, 'start-date-year': '' },
      { abortEarly: false }
    )
    expect(error.details[0].message).toBe('PREFERRED_START_YEAR_REQUIRED')
  })

  test('should fail with PREFERRED_END_MONTH_REQUIRED when end month is empty', () => {
    const { error } = preferredDatesSchema.validate(
      { ...validPayload, 'end-date-month': '' },
      { abortEarly: false }
    )
    expect(error.details[0].message).toBe('PREFERRED_END_MONTH_REQUIRED')
  })

  test('should fail with PREFERRED_END_YEAR_REQUIRED when end year is empty', () => {
    const { error } = preferredDatesSchema.validate(
      { ...validPayload, 'end-date-year': '' },
      { abortEarly: false }
    )
    expect(error.details[0].message).toBe('PREFERRED_END_YEAR_REQUIRED')
  })

  test('should return all four errors when all fields are empty', () => {
    const { error } = preferredDatesSchema.validate(
      {
        'start-date-month': '',
        'start-date-year': '',
        'end-date-month': '',
        'end-date-year': ''
      },
      { abortEarly: false }
    )
    const messages = error.details.map((d) => d.message)
    expect(messages).toContain('PREFERRED_START_MONTH_REQUIRED')
    expect(messages).toContain('PREFERRED_START_YEAR_REQUIRED')
    expect(messages).toContain('PREFERRED_END_MONTH_REQUIRED')
    expect(messages).toContain('PREFERRED_END_YEAR_REQUIRED')
    expect(messages).toHaveLength(4)
  })

  describe('month format validation', () => {
    test.each(['1', '01', '12'])('should accept valid month "%s"', (month) => {
      const { error } = preferredDatesSchema.validate({
        ...validPayload,
        'start-date-month': month
      })
      expect(error).toBeUndefined()
    })

    test.each(['0', '00', '13'])(
      'should fail with PREFERRED_START_MONTH_INVALID for invalid month "%s"',
      (month) => {
        const { error } = preferredDatesSchema.validate({
          ...validPayload,
          'start-date-month': month
        })
        expect(error.details[0].message).toBe('PREFERRED_START_MONTH_INVALID')
      }
    )

    test('should fail with PREFERRED_END_MONTH_INVALID for invalid end month', () => {
      const { error } = preferredDatesSchema.validate({
        ...validPayload,
        'end-date-month': '13'
      })
      expect(error.details[0].message).toBe('PREFERRED_END_MONTH_INVALID')
    })
  })

  describe('year format validation', () => {
    test.each(['2024', '2026', '1999', '2100'])(
      'should accept valid year "%s"',
      (year) => {
        const { error } = preferredDatesSchema.validate({
          ...validPayload,
          'start-date-year': year
        })
        expect(error).toBeUndefined()
      }
    )

    test.each(['202', '20261', 'abcd', '202a', '24'])(
      'should fail with PREFERRED_START_YEAR_INVALID for invalid year "%s"',
      (year) => {
        const { error } = preferredDatesSchema.validate({
          ...validPayload,
          'start-date-year': year
        })
        expect(error.details[0].message).toBe('PREFERRED_START_YEAR_INVALID')
      }
    )

    test('should fail with PREFERRED_END_YEAR_INVALID for invalid end year', () => {
      const { error } = preferredDatesSchema.validate({
        ...validPayload,
        'end-date-year': '202'
      })
      expect(error.details[0].message).toBe('PREFERRED_END_YEAR_INVALID')
    })
  })

  describe('empty fields produce required errors, not invalid', () => {
    test('empty start month produces required error, not invalid', () => {
      const { error } = preferredDatesSchema.validate({
        ...validPayload,
        'start-date-month': ''
      })
      expect(error.details[0].message).toBe('PREFERRED_START_MONTH_REQUIRED')
    })

    test('empty start year produces required error, not invalid', () => {
      const { error } = preferredDatesSchema.validate({
        ...validPayload,
        'start-date-year': ''
      })
      expect(error.details[0].message).toBe('PREFERRED_START_YEAR_REQUIRED')
    })
  })
})
