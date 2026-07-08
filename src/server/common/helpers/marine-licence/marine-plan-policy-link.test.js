import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

describe('#getMarinePlanPolicyLink', () => {
  test('builds the consideration link for a policy code', () => {
    expect(getMarinePlanPolicyLink('SW-BIO-1')).toBe(
      '/marine-licence/marine-plan-policy/SW-BIO-1'
    )
  })

  test('encodes characters that are unsafe in a path segment', () => {
    expect(getMarinePlanPolicyLink('A B/1')).toBe(
      '/marine-licence/marine-plan-policy/A%20B%2F1'
    )
  })
})
