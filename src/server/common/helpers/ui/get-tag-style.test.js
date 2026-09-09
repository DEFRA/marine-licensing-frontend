import { getTagStyle } from './get-tag-style.js'

describe('getTagStyle', () => {
  it('should return blue for Draft', () => {
    expect(getTagStyle('Draft')).toBe('govuk-tag--blue')
  })

  it('should return grey for Withdrawn', () => {
    expect(getTagStyle('Withdrawn')).toBe('govuk-tag--grey')
  })

  it('should return green for Scheduled', () => {
    expect(getTagStyle('Scheduled')).toBe('govuk-tag--green')
  })

  it('should return teal for Active', () => {
    expect(getTagStyle('Active')).toBe('govuk-tag--teal')
  })

  it('should return grey for Expired', () => {
    expect(getTagStyle('Expired')).toBe('govuk-tag--grey')
  })

  it('should return magenta for Transferred', () => {
    expect(getTagStyle('Transferred')).toBe('govuk-tag--magenta')
  })

  it('should return orange for Rejected', () => {
    expect(getTagStyle('Rejected')).toBe('govuk-tag--orange')
  })

  it('should return green for unknown status, so marine licences are unaffected', () => {
    expect(getTagStyle('Submitted')).toBe('govuk-tag--green')
  })
})
