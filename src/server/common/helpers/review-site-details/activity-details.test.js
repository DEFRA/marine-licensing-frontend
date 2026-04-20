import {
  formatActivityType,
  parseActivityDetails
} from '#src/server/common/helpers/review-site-details/activity-details.js'

describe('formatActivityType', () => {
  test('returns label for construction', () => {
    expect(formatActivityType('construction-type-1')).toBe(
      "What you're constructing"
    )
  })

  test('returns label for deposit', () => {
    expect(formatActivityType('deposit-type-1')).toBe(
      "What deposit activity you're continuing"
    )
  })

  test('returns label for removal', () => {
    expect(formatActivityType('removal-type-1')).toBe(
      "What you're removing for the first time on a one off basis"
    )
  })

  test('returns the value unchanged for an unknown activity type', () => {
    expect(formatActivityType('unknown-type')).toBe(null)
  })
})

describe('parseActivityDetails', () => {
  test('returns formatted activity details from site', () => {
    const siteDetails = {
      activityDetails: [
        { activitySubType: 'construction-type-1', someField: 'value' }
      ]
    }

    expect(parseActivityDetails(siteDetails)).toEqual([
      { activitySubType: "What you're constructing", someField: 'value' }
    ])
  })

  test('returns empty array when activityDetails is missing', () => {
    expect(parseActivityDetails({})).toEqual([])
  })
})
