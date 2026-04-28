import {
  formatActivityDuration,
  formatActivitySubTypeHeading,
  formatActivitySubTypeLabel,
  getOtherActivityLabel,
  mapActivitySelections,
  parseActivityDetails
} from '#src/server/common/helpers/review-site-details/activity-details.js'

describe('formatActivitySubTypeLabel', () => {
  test('returns label for construction-type-1', () => {
    expect(formatActivitySubTypeLabel('construction-type-1')).toBe(
      'Construction of new works'
    )
  })

  test('returns label for construction-type-2', () => {
    expect(formatActivitySubTypeLabel('construction-type-2')).toBe(
      'Maintenance of existing works'
    )
  })

  test('returns label for construction-type-3', () => {
    expect(formatActivitySubTypeLabel('construction-type-3')).toBe(
      'Alteration or improvement, including extending, of existing marine works'
    )
  })

  test('returns label for deposit-type-1', () => {
    expect(formatActivitySubTypeLabel('deposit-type-1')).toBe(
      'Continuation of existing deposit activity'
    )
  })

  test('returns label for deposit-type-2', () => {
    expect(formatActivitySubTypeLabel('deposit-type-2')).toBe(
      'Deposit of something new'
    )
  })

  test('returns label for deposit-type-3', () => {
    expect(formatActivitySubTypeLabel('deposit-type-3')).toBe(
      'Replacing existing object'
    )
  })

  test('returns label for removal-type-1', () => {
    expect(formatActivitySubTypeLabel('removal-type-1')).toBe(
      'One off first time removal'
    )
  })

  test('returns label for removal-type-2', () => {
    expect(formatActivitySubTypeLabel('removal-type-2')).toBe(
      'Removal as part of an ongoing or routine activity'
    )
  })

  test('returns label for removal-type-3', () => {
    expect(formatActivitySubTypeLabel('removal-type-3')).toBe(
      'Removal for replacement'
    )
  })

  test('returns label for removal-type-4', () => {
    expect(formatActivitySubTypeLabel('removal-type-4')).toBe(
      'Removal for relocation'
    )
  })

  test('returns null for an unknown activity type', () => {
    expect(formatActivitySubTypeLabel('unknown')).toBe(null)
  })
})

describe('formatActivitySubTypeHeading', () => {
  test('returns label for construction', () => {
    expect(formatActivitySubTypeHeading('construction-type-1')).toBe(
      "What you're constructing"
    )
  })

  test('returns label for deposit', () => {
    expect(formatActivitySubTypeHeading('deposit-type-1')).toBe(
      "What deposit activity you're continuing"
    )
  })

  test('returns label for removal', () => {
    expect(formatActivitySubTypeHeading('removal-type-1')).toBe(
      "What you're removing for the first time on a one off basis"
    )
  })

  test('returns the value unchanged for an unknown activity type', () => {
    expect(formatActivitySubTypeHeading('unknown-type')).toBe(null)
  })
})

describe('getOtherActivityLabel', () => {
  test('returns construction label with text', () => {
    expect(getOtherActivityLabel('construction', 'my structure')).toBe(
      'Other structures: my structure'
    )
  })

  test('returns deposit label with text', () => {
    expect(getOtherActivityLabel('deposit', 'my deposit')).toBe(
      'Other deposits: my deposit'
    )
  })

  test('returns removal label with text', () => {
    expect(getOtherActivityLabel('removal', 'my object')).toBe(
      'Other substances or objects: my object'
    )
  })

  test('returns the text unchanged for unknown activity type', () => {
    expect(getOtherActivityLabel('unknown', 'something')).toBe('something')
  })
})

describe('mapActivitySelections', () => {
  test('maps known selections to ACTIVITY_LABELS', () => {
    const activities = { selections: ['CON1', 'CON2'] }
    expect(mapActivitySelections(activities, 'construction')).toEqual([
      'Aquaculture trestles or fixed walkways',
      'Piled or fixed aquaculture structures'
    ])
  })

  test('maps other selection using otherActivity text and activityType', () => {
    const activities = {
      selections: ['CON1', 'other'],
      otherActivity: 'my custom structure'
    }
    expect(mapActivitySelections(activities, 'construction')).toEqual([
      'Aquaculture trestles or fixed walkways',
      'Other structures: my custom structure'
    ])
  })

  test('returns empty array when activities is undefined', () => {
    expect(mapActivitySelections(undefined, 'construction')).toEqual([])
  })
})

describe('parseActivityDetails', () => {
  test('returns formatted activity details from site', () => {
    const siteDetails = {
      activityDetails: [
        {
          activityDuration: { years: 1, months: 10 },
          activitySubType: 'construction-type-1',
          activityType: 'construction',
          activities: { selections: ['CON1'] },
          someField: 'value'
        }
      ]
    }

    expect(parseActivityDetails(siteDetails)).toEqual([
      {
        activityDuration: '1 year, 10 months',
        activityHeading: "What you're constructing",
        activityLink:
          '/marine-licence/activity-details/what-are-you-constructing',
        activitySubType: 'Construction of new works',
        activityType: 'construction',
        activities: ['Aquaculture trestles or fixed walkways'],
        someField: 'value'
      }
    ])
  })

  test('maps other selection using otherActivity text', () => {
    const siteDetails = {
      activityDetails: [
        {
          activitySubType: 'removal-type-1',
          activityType: 'removal',
          activities: { selections: ['other'], otherActivity: 'old pipe' }
        }
      ]
    }

    expect(parseActivityDetails(siteDetails)[0].activities).toEqual([
      'Other substances or objects: old pipe'
    ])
  })

  test('returns empty array when activityDetails is missing', () => {
    expect(parseActivityDetails({})).toEqual([])
  })
})

describe('formatActivityDuration', () => {
  test('returns formatted activity details from site', () => {
    expect(formatActivityDuration({ years: 1, months: 10 })).toEqual(
      '1 year, 10 months'
    )
  })

  test('correctly handles plurals', () => {
    expect(formatActivityDuration({ years: 1, months: 1 })).toEqual(
      '1 year, 1 month'
    )

    expect(formatActivityDuration({ years: 2, months: 2 })).toEqual(
      '2 years, 2 months'
    )
  })

  test('omits years when years is 0', () => {
    expect(formatActivityDuration({ years: 0, months: 6 })).toEqual('6 months')

    expect(formatActivityDuration({ years: 0, months: 1 })).toEqual('1 month')
  })

  test('omits months when months is 0', () => {
    expect(formatActivityDuration({ years: 2, months: 0 })).toEqual('2 years')

    expect(formatActivityDuration({ years: 1, months: 0 })).toEqual('1 year')
  })

  test('returns null when years or months is missing', () => {
    expect(formatActivityDuration({ years: 2 })).toEqual(null)

    expect(formatActivityDuration({ months: 6 })).toEqual(null)
  })
})
