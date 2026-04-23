import { getTagStyle } from './get-tag-style.js'

describe('getTagStyle', () => {
  it('should return blue for Draft', () => {
    expect(getTagStyle('Draft')).toBe('govuk-tag--blue')
  })

  it('should return grey for Withdrawn', () => {
    expect(getTagStyle('Withdrawn')).toBe('govuk-tag--grey')
  })

  it('should return green for Active', () => {
    expect(getTagStyle('Active')).toBe('govuk-tag--green')
  })

  it('should return green for unknown status', () => {
    expect(getTagStyle('SomeOtherStatus')).toBe('govuk-tag--green')
  })
})
