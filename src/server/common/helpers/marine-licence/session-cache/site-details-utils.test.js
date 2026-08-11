import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  getSiteDetailsBySite,
  getActivityDetailsByIndex,
  siteHasOtherActivityRequiringDrawing
} from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'

describe('getSiteDetailsBySite', () => {
  test('should correctly return the first array element when index not specified', () => {
    const site = getSiteDetailsBySite(mockMarineLicenceApplication)
    expect(site).toEqual(mockMarineLicenceApplication.siteDetails[0])
  })

  test('should correctly return the specified site', () => {
    const mockMultiSiteMarineLicence = {
      ...mockMarineLicenceApplication,
      siteDetails: [
        mockMarineLicenceApplication.siteDetails[0],
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          siteName: 'second site'
        }
      ]
    }
    const site = getSiteDetailsBySite(mockMultiSiteMarineLicence, 1)
    expect(site).toEqual(mockMultiSiteMarineLicence.siteDetails[1])
  })

  test('should correctly handle no existing data', () => {
    const site = getSiteDetailsBySite({})
    expect(site).toEqual({})
  })
})

describe('getActivityDetailsByIndex', () => {
  test('should correctly return the first array element when index not specified', () => {
    const site = getActivityDetailsByIndex(mockMarineLicenceApplication)
    expect(site).toEqual(
      mockMarineLicenceApplication.siteDetails[0].activityDetails[0]
    )
  })

  test('should correctly return the specified activity details', () => {
    const mockMultiSiteMarineLicence = {
      ...mockMarineLicenceApplication,
      siteDetails: [
        mockMarineLicenceApplication.siteDetails[0],
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          siteName: 'second site'
        }
      ]
    }
    const site = getActivityDetailsByIndex(mockMultiSiteMarineLicence, 1, 0)
    expect(site).toEqual(
      mockMultiSiteMarineLicence.siteDetails[1].activityDetails[0]
    )
  })

  test('should correctly handle no existing data', () => {
    const site = getActivityDetailsByIndex({})
    expect(site).toEqual({})
  })
})

describe('siteHasOtherActivityRequiringDrawing', () => {
  const buildLicence = (activityDetails) => ({
    ...mockMarineLicenceApplication,
    siteDetails: [
      { ...mockMarineLicenceApplication.siteDetails[0], activityDetails }
    ]
  })

  test('returns true when another activity on the site still requires a drawing', () => {
    const marineLicence = buildLicence([
      { activitySubType: 'construction-type-2' },
      { activitySubType: 'construction-type-1' }
    ])

    expect(siteHasOtherActivityRequiringDrawing(marineLicence, 0, 0)).toBe(true)
  })

  test('returns false when no other activity on the site requires a drawing', () => {
    const marineLicence = buildLicence([
      { activitySubType: 'construction-type-1' },
      { activitySubType: 'construction-type-2' }
    ])

    expect(siteHasOtherActivityRequiringDrawing(marineLicence, 0, 0)).toBe(
      false
    )
  })

  test('ignores the activity at the given index itself', () => {
    const marineLicence = buildLicence([
      { activitySubType: 'construction-type-1' }
    ])

    expect(siteHasOtherActivityRequiringDrawing(marineLicence, 0, 0)).toBe(
      false
    )
  })

  test('returns false when there is no existing data', () => {
    expect(siteHasOtherActivityRequiringDrawing({}, 0, 0)).toBe(false)
  })
})
