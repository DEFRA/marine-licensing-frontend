import {
  getReviewSummaryText,
  getCoordinateSystemText,
  getCoordinateDisplayText
} from '~/src/server/exemption/site-details/review-site-details/utils.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'

describe('siteDetails utils', () => {
  describe('getReviewSummaryText utils', () => {
    test('getReviewSummaryText correctly returns text for site details circle width text', () => {
      expect(
        getReviewSummaryText({
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates'
        })
      ).toBe(
        'Manually enter one set of coordinates and a width to create a circular site'
      )
    })

    test('getReviewSummaryText correctly returns blank otherwise', () => {
      expect(getReviewSummaryText({})).toBe('')
    })
  })

  describe('getCoordinateSystemText utils', () => {
    test('getCoordinateSystemText correctly returns text for OSGB36', () => {
      expect(getCoordinateSystemText(COORDINATE_SYSTEMS.OSGB36)).toBe(
        'OSGB36 (National Grid)\nEastings and Northings'
      )
    })

    test('getCoordinateSystemText correctly returns text for WGS84', () => {
      expect(getCoordinateSystemText(COORDINATE_SYSTEMS.WGS84)).toBe(
        'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
      )
    })

    test('getReviewSummaryText correctly returns blank otherwise', () => {
      expect(getCoordinateSystemText()).toBe('')
    })
  })

  describe('getCoordinateDisplayText utils', () => {
    test('getCoordinateDisplayText correctly returns text for WGS84', () => {
      expect(
        getCoordinateDisplayText(
          { coordinates: mockExemption.siteDetails.coordinates },
          COORDINATE_SYSTEMS.WGS84
        )
      ).toBe(
        `${mockExemption.siteDetails.coordinates.latitude || ''}, ${mockExemption.siteDetails.coordinates.longitude || ''}`
      )
    })

    test('getCoordinateDisplayText correctly returns text for OSGB36', () => {
      expect(
        getCoordinateDisplayText(
          { coordinates: { eastings: '425053', northings: '564180' } },
          COORDINATE_SYSTEMS.OSGB36
        )
      ).toBe(`425053, 564180`)
    })

    test('getCoordinateDisplayText correctly returns blank when site details blank', () => {
      expect(getCoordinateDisplayText({}, COORDINATE_SYSTEMS.OSGB36)).toBe('')
    })

    test('getCoordinateDisplayText correctly returns blank otherwise', () => {
      expect(getCoordinateDisplayText({})).toBe('')
    })
  })
})
