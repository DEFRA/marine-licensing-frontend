import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getActivityDetailsBackLink,
  getCoordinateSystemBackLink
} from '#src/server/marine-licence/site-details/utils/back-link.js'

describe('getActivityDetailsBackLink', () => {
  test('returns the review site details route with the correct anchor', () => {
    expect(getActivityDetailsBackLink(1, 2)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-2`
    )
  })
})

describe('getCoordinateSystemBackLink', () => {
  test('returns coordinate system choice with site and action when action is set and originalCoordinateSystem exists', () => {
    expect(
      getCoordinateSystemBackLink('change', 2, {
        originalCoordinateSystem: 'wgs84'
      })
    ).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE}?site=2&action=change`
    )
  })

  test('returns review site details anchor when action is set and no originalCoordinateSystem', () => {
    expect(getCoordinateSystemBackLink('change', 2, {})).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-2`
    )
  })

  test('returns coordinate system choice with no site param for site 1 when no action', () => {
    expect(getCoordinateSystemBackLink(undefined, 1, {})).toBe(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
    )
  })

  test('returns coordinate system choice with site param for site 2 when no action', () => {
    expect(getCoordinateSystemBackLink(undefined, 2, {})).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE}?site=2`
    )
  })
})
