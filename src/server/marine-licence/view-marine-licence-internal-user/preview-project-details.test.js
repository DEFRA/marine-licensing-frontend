import { vi } from 'vitest'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { wrapRedactionLabels } from '#src/server/common/helpers/marine-licence/redaction-label.js'
import {
  buildRedactedPreviewProjectDetails,
  buildRedactedSiteDetails
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
      expect({ ...result, [field]: marineLicence[field] }).toEqual(marineLicence)
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
    expect(activity.activities[0].val).toBe(wrapRedactionLabels('***REDACTED***'))
    expect(activity.activityDescription.val).toBe(
      wrapRedactionLabels('Digging ***REDACTED***')
    )
    expect(activity.activityDuration.val).toBe(wrapRedactionLabels('***REDACTED***'))
    expect(activity.completionDate.val).toBe(wrapRedactionLabels('***REDACTED***'))
    expect(activity.activityMonths.val).toBe(wrapRedactionLabels('***REDACTED***'))
    expect(activity.workingHours.val).toBe(
      wrapRedactionLabels('***REDACTED*** hours')
    )
    expect(result.summaryData[0].activityDetails[1].activityDescription).toBe(
      'Second activity'
    )
  })
})
