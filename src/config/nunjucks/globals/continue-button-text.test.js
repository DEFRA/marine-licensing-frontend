import { continueButtonText } from '#src/config/nunjucks/globals/continue-button-text.js'

describe('continueButtonText', () => {
  test('returns "Save and continue" when changing', () => {
    expect(continueButtonText(true)).toBe('Save and continue')
    expect(continueButtonText('change')).toBe('Save and continue')
  })

  test('returns "Continue" when not changing', () => {
    expect(continueButtonText(false)).toBe('Continue')
    expect(continueButtonText(undefined)).toBe('Continue')
    expect(continueButtonText('')).toBe('Continue')
  })
})
