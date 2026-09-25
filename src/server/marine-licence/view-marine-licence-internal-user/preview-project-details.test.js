import { vi } from 'vitest'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { wrapRedactionLabels } from '#src/server/common/helpers/marine-licence/redaction-label.js'
import {
  EXCLUDED_ACTIVITIES_HEADING,
  FILE_UPLOAD_HEADING,
  NAUTICAL_MILE_HEADING
} from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import {
  buildRedactedMarinePlanPolicies,
  buildRedactedOtherPermissions,
  buildRedactedPreviewProjectDetails,
  buildRedactedSiteDetails,
  buildRedactedWaterFrameworkDirectiveData
} from '#src/server/marine-licence/view-marine-licence-internal-user/preview-project-details.js'

vi.mock('#src/server/common/helpers/marine-licence/site-data.js', () => ({
  buildSiteData: vi.fn()
}))

const marineLicence = {
  projectName: 'Test Project',
  projectBackground: 'Test project background',
  preferredDates: 'July 2026 to August 2027'
}

describe('buildRedactedPreviewProjectDetails', () => {
  test('returns the same project fields as the standard page when nothing is redacted', () => {
    expect(buildRedactedPreviewProjectDetails(marineLicence)).toEqual({
      projectName: 'Test Project',
      projectBackground: 'Test project background',
      preferredDates: 'July 2026 to August 2027'
    })
  })

  test.each([
    ['projectName', 'Harbour ***REDACTED*** works'],
    ['projectBackground', 'Works at ***REDACTED***'],
    ['preferredDates', 'From ***REDACTED***']
  ])(
    'publishes redacted %s and leaves the other fields',
    (field, redactedText) => {
      const result = buildRedactedPreviewProjectDetails({
        ...marineLicence,
        redactions: { [field]: { redactedText } }
      })

      expect(result[field].val).toBe(wrapRedactionLabels(redactedText))
      expect({ ...result, [field]: marineLicence[field] }).toEqual(
        marineLicence
      )
    }
  )
})

describe('buildRedactedSiteDetails', () => {
  const summaryData = [
    { siteName: 'Test', siteNumber: 1, width: '500 metres' },
    { siteName: 'Second site', siteNumber: 2 }
  ]

  beforeEach(() => {
    vi.mocked(buildSiteData).mockReturnValue({
      coordinatesType: 'coordinates',
      summaryData
    })
  })

  test('keeps each site name when that site has no redaction', () => {
    expect(buildRedactedSiteDetails({})).toEqual({
      coordinatesType: 'coordinates',
      summaryData
    })
  })

  test('publishes the redacted site name for that site only', () => {
    const result = buildRedactedSiteDetails({
      redactions: {
        siteDetails: {
          0: {
            siteName: { redactedText: 'Test ***REDACTED***' },
            withholdLocation: { withhold: false }
          }
        }
      }
    })

    expect(result.coordinatesType).toBe('coordinates')
    expect(result.summaryData[0].siteName.val).toBe(
      wrapRedactionLabels('Test ***REDACTED***')
    )
    expect(result.summaryData[0].width).toBe('500 metres')
    expect(result.summaryData[1].siteName).toBe('Second site')
  })

  test('publishes the redacted circle width for that site only', () => {
    const result = buildRedactedSiteDetails({
      redactions: {
        siteDetails: {
          0: { circleWidth: { redactedText: '500 ***REDACTED***' } }
        }
      }
    })

    expect(result.summaryData[0].width.val).toBe(
      wrapRedactionLabels('500 ***REDACTED***')
    )
    expect(result.summaryData[0].siteName).toBe('Test')
    expect(result.summaryData[1].width).toBeUndefined()
  })

  test('publishes redacted activity text for that activity only', () => {
    vi.mocked(buildSiteData).mockReturnValue({
      coordinatesType: 'file',
      summaryData: [
        {
          siteName: 'Test',
          activityDetails: [
            {
              activitySubType: 'Construction',
              activities: ['Piles'],
              activityDescription: 'Digging',
              activityDuration: '1 year',
              completionDate: 'June 2027',
              activityMonths: 'No',
              workingHours: '9 to 5'
            },
            { activityDescription: 'Second activity' }
          ]
        }
      ]
    })

    const result = buildRedactedSiteDetails({
      redactions: {
        siteDetails: {
          0: {
            activityDetails: {
              0: {
                activitySubType: { redactedText: '***REDACTED*** works' },
                activities: { redactedText: '***REDACTED***' },
                activityDescription: { redactedText: 'Digging ***REDACTED***' },
                activityDuration: { redactedText: '***REDACTED***' },
                completionDate: { redactedText: '***REDACTED***' },
                activityMonths: { redactedText: '***REDACTED***' },
                workingHours: { redactedText: '***REDACTED*** hours' }
              }
            }
          }
        }
      }
    })

    const activity = result.summaryData[0].activityDetails[0]

    expect(activity.activitySubType.val).toBe(
      wrapRedactionLabels('***REDACTED*** works')
    )
    expect(activity.activities[0].val).toBe(
      wrapRedactionLabels('***REDACTED***')
    )
    expect(activity.activityDescription.val).toBe(
      wrapRedactionLabels('Digging ***REDACTED***')
    )
    expect(activity.activityDuration.val).toBe(
      wrapRedactionLabels('***REDACTED***')
    )
    expect(activity.completionDate.val).toBe(
      wrapRedactionLabels('***REDACTED***')
    )
    expect(activity.activityMonths.val).toBe(
      wrapRedactionLabels('***REDACTED***')
    )
    expect(activity.workingHours.val).toBe(
      wrapRedactionLabels('***REDACTED*** hours')
    )
    expect(result.summaryData[0].activityDetails[1].activityDescription).toBe(
      'Second activity'
    )
  })
})

describe('buildRedactedOtherPermissions', () => {
  const permissions = {
    specialLegalPowers: { agree: 'no' },
    harbourAuthority: { area: 'yes', details: 'Harbour details' },
    otherAuthorities: { agree: 'yes', details: 'Council' },
    publicConsultation: { consulted: 'yes', details: 'Fishing group' }
  }

  test('returns the same permissions when nothing is redacted', () => {
    expect(buildRedactedOtherPermissions(permissions)).toEqual(permissions)
  })

  test('publishes each redacted permission as the displayed details', () => {
    const result = buildRedactedOtherPermissions({
      ...permissions,
      redactions: {
        specialLegalPowers: { redactedText: '***REDACTED*** powers' },
        harbourAuthority: { redactedText: '***REDACTED*** harbour' }
      }
    })

    expect(result.specialLegalPowers.agree).toBe('yes')
    expect(result.specialLegalPowers.details.val).toBe(
      wrapRedactionLabels('***REDACTED*** powers')
    )
    expect(result.harbourAuthority.area).toBe('yes')
    expect(result.harbourAuthority.details.val).toBe(
      wrapRedactionLabels('***REDACTED*** harbour')
    )
    expect(result.otherAuthorities).toEqual(permissions.otherAuthorities)
    expect(result.publicConsultation).toEqual(permissions.publicConsultation)
  })
})

describe('buildRedactedMarinePlanPolicies', () => {
  const marineLicence = {
    marinePlanPolicies: [
      { policyCode: 'S-CC-1', policy: 'First wording' },
      { policyCode: 'S-CC-2', policy: 'Second wording' }
    ],
    marinePlanPolicyResponses: {
      'S-CC-1': 'First consideration',
      'S-CC-2': 'Second consideration'
    }
  }

  test('publishes the redacted consideration and leaves the other policy', () => {
    const result = buildRedactedMarinePlanPolicies({
      ...marineLicence,
      redactions: {
        marinePlanPolicyResponses: {
          'S-CC-1': { redactedText: 'First ***REDACTED***' }
        }
      }
    })

    const first = result.find((policy) => policy.policyCode === 'S-CC-1')
    const second = result.find((policy) => policy.policyCode === 'S-CC-2')

    expect(first.wording).toBe('First wording')
    expect(first.response.val).toBe(wrapRedactionLabels('First ***REDACTED***'))
    expect(second.response).toBe('Second consideration')
  })
})

describe('buildRedactedWaterFrameworkDirectiveData', () => {
  const marineLicence = {
    waterFrameworkDirective: {
      nauticalMile: 'yes',
      excludedActivities: 'no',
      uploadedFile: { filename: 'assessment.pdf' }
    }
  }

  test('returns the same display values when nothing is redacted', () => {
    const result = buildRedactedWaterFrameworkDirectiveData(marineLicence)

    expect(result.nauticalMile.value.text).toBe('Yes')
    expect(result.excludedActivities.value.text).toBe('No')
    expect(result.uploadedFile.value.text).toBe('assessment.pdf')
  })

  test('publishes the redacted nautical mile and excluded activities text', () => {
    const result = buildRedactedWaterFrameworkDirectiveData({
      ...marineLicence,
      redactions: {
        waterFrameworkDirective: {
          nauticalMile: { redactedText: '***REDACTED*** mile' },
          excludedActivities: { redactedText: '***REDACTED*** activities' }
        }
      }
    })

    expect(result.nauticalMile.key.text).toBe(NAUTICAL_MILE_HEADING)
    expect(result.nauticalMile.value.text.val).toBe(
      wrapRedactionLabels('***REDACTED*** mile')
    )
    expect(result.excludedActivities.key.text).toBe(EXCLUDED_ACTIVITIES_HEADING)
    expect(result.excludedActivities.value.text.val).toBe(
      wrapRedactionLabels('***REDACTED*** activities')
    )
    expect(result.uploadedFile.value.text).toBe('assessment.pdf')
    expect(result.uploadedFile.key.text).toBe(FILE_UPLOAD_HEADING)
  })
})
