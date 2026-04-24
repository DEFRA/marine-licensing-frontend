import { getActivityVariantFromSubType } from '#src/server/common/helpers/activity-details/activity-variants.js'

describe('getActivityVariantFromSubType', () => {
  test('returns correct variant for a subtype', () => {
    expect(getActivityVariantFromSubType('construction-type-1')).toBe(
      'what-are-you-constructing'
    )
  })

  test('returns undefined for an unknown subtype', () => {
    expect(getActivityVariantFromSubType('unknown-type')).toBeUndefined()
  })
})
