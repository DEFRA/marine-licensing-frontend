import { PUBLIC_NOTICE_REQUEST_RELATES_TO } from '#src/server/common/constants/site-notice.js'
import {
  getDisplayConditions,
  getEvidenceSubmission,
  getSiteNoticeValues,
  isSiteNoticeEvidenceComplete
} from '#src/server/marine-licence/site-notice/display/utils.js'

describe('getEvidenceSubmission', () => {
  test('returns null when the task has not been resolved', () => {
    expect(getEvidenceSubmission({ resolvedAt: null })).toBeNull()
  })

  test('returns when and who the evidence was submitted by', () => {
    expect(
      getEvidenceSubmission({
        resolvedAt: '2026-10-05T10:00:00.000Z',
        resolvedByName: 'Sam Evans'
      })
    ).toEqual({ resolvedAt: '5 October 2026', resolvedByName: 'Sam Evans' })
  })
})

describe('isSiteNoticeEvidenceComplete', () => {
  const completeEvidence = {
    locationName: 'North pier',
    dateDisplayed: '22 May 2026',
    closeUpPhoto: 'close.jpg',
    positionPhoto: 'position.jpg'
  }

  test('is true when every location has all four answers', () => {
    expect(
      isSiteNoticeEvidenceComplete([completeEvidence, completeEvidence])
    ).toBe(true)
  })

  test('is false when there is no evidence', () => {
    expect(isSiteNoticeEvidenceComplete([])).toBe(false)
  })

  test.each(['locationName', 'dateDisplayed', 'closeUpPhoto', 'positionPhoto'])(
    'is false when any location is missing %s',
    (field) => {
      expect(
        isSiteNoticeEvidenceComplete([
          completeEvidence,
          { ...completeEvidence, [field]: undefined }
        ])
      ).toBe(false)
    }
  )
})
import { mockMarineLicenceWithApplicationTask } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('getDisplayConditions', () => {
  const mockMultiSiteMarineLicenceApplication = {
    ...mockMarineLicenceWithApplicationTask,
    siteDetails: [
      mockMarineLicenceWithApplicationTask.siteDetails[0],
      mockMarineLicenceWithApplicationTask.siteDetails[0]
    ]
  }

  const task = mockMarineLicenceWithApplicationTask.applicationTasks[1].data

  test('returns true correctly for correct BOTH values and multi sites', () => {
    const data = getDisplayConditions(
      mockMultiSiteMarineLicenceApplication,
      task
    )

    expect(data.showCommunityUserSection).toBe(true)
    expect(data.showMarineUserSection).toBe(true)
    expect(data.showMultipleSitesSection).toBe(true)
  })

  test('returns true correctly for correct community user values and multi sites', () => {
    const modifiedTask = {
      ...task,
      requestRelatesTo: PUBLIC_NOTICE_REQUEST_RELATES_TO.COMMUNITY_USERS
    }

    const data = getDisplayConditions(
      mockMultiSiteMarineLicenceApplication,
      modifiedTask
    )

    expect(data.showCommunityUserSection).toBe(true)
    expect(data.showMarineUserSection).toBe(false)
    expect(data.showMultipleSitesSection).toBe(true)
  })

  test('returns true correctly for correct marine user values and multi sites', () => {
    const modifiedTask = {
      ...task,
      requestRelatesTo: PUBLIC_NOTICE_REQUEST_RELATES_TO.MARINE_USERS
    }

    const data = getDisplayConditions(
      mockMultiSiteMarineLicenceApplication,
      modifiedTask
    )

    expect(data.showCommunityUserSection).toBe(false)
    expect(data.showMarineUserSection).toBe(true)
    expect(data.showMultipleSitesSection).toBe(true)
  })

  test('returns false correctly for empty data', () => {
    const data = getDisplayConditions(
      mockMarineLicenceWithApplicationTask,
      undefined
    )

    expect(data.showCommunityUserSection).toBeFalsy()
    expect(data.showMarineUserSection).toBeFalsy()
    expect(data.showMultipleSitesSection).toBeFalsy()
  })

  test('hides multiple sites section when siteDetails is absent', () => {
    const data = getDisplayConditions({}, task)

    expect(data.showMultipleSitesSection).toBe(false)
  })
})

describe('getSiteNoticeValues', () => {
  const evidence = {
    locationName: 'Harbour wall',
    dateDisplayed: { day: '5', month: '03', year: '2026' },
    closeUpPhoto: { uploadedFile: { filename: 'close-up.jpg' } },
    positionPhoto: { uploadedFile: { filename: 'position.jpg' } }
  }

  test('maps evidence for the display page', () => {
    expect(getSiteNoticeValues({ siteNoticeEvidence: [evidence] })).toEqual([
      {
        locationName: 'Harbour wall',
        dateDisplayed: '5 March 2026',
        closeUpPhoto: 'close-up.jpg',
        positionPhoto: 'position.jpg'
      }
    ])
  })

  test('returns null when the displayed date is missing', () => {
    const [values] = getSiteNoticeValues({
      siteNoticeEvidence: [{ ...evidence, dateDisplayed: null }]
    })

    expect(values.dateDisplayed).toBeNull()
  })

  test('returns an empty list when there is no evidence', () => {
    expect(getSiteNoticeValues({})).toEqual([])
  })
})
