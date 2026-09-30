import { PUBLIC_NOTICE_REQUEST_RELATES_TO } from '#src/server/common/constants/site-notice.js'
import { getDisplayConditions } from '#src/server/marine-licence/site-notice/display/utils.js'
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
      task,
      mockMultiSiteMarineLicenceApplication
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
      modifiedTask,
      mockMultiSiteMarineLicenceApplication
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
      modifiedTask,
      mockMultiSiteMarineLicenceApplication
    )

    expect(data.showCommunityUserSection).toBe(false)
    expect(data.showMarineUserSection).toBe(true)
    expect(data.showMultipleSitesSection).toBe(true)
  })

  test('returns false correctly for empty data', () => {
    const data = getDisplayConditions(
      undefined,
      mockMarineLicenceWithApplicationTask
    )

    expect(data.showCommunityUserSection).toBeFalsy()
    expect(data.showMarineUserSection).toBeFalsy()
    expect(data.showMultipleSitesSection).toBeFalsy()
  })
})
