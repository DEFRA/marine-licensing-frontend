import { formatActivityType } from '#src/server/common/helpers/review-site-details/activity-details.js'

describe('formatActivityType', () => {
  test('returns label for construction', () => {
    expect(formatActivityType('construction')).toBe("What you're constructing")
  })

  test('returns label for deposit', () => {
    expect(formatActivityType('deposit')).toBe(
      "What deposit activity you're continuing"
    )
  })

  test('returns label for removal', () => {
    expect(formatActivityType('removal')).toBe(
      "What you're removing for the first time on a one off basis"
    )
  })

  test('returns the value unchanged for an unknown activity type', () => {
    expect(formatActivityType('unknown-type')).toBe('unknown-type')
  })
})
