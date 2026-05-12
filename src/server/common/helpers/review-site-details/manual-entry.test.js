import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import {
  buildManualCoordinateSummaryData,
  getCoordinateDisplayText,
  getCoordinateSystemText,
  getPolygonCoordinatesDisplayData,
  getReviewSummaryText
} from '#src/server/common/helpers/review-site-details/manual-entry.js'
import { mockActivityDetails } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('manual-entry helpers', () => {
  describe('getCoordinateSystemText', () => {
    test('returns text for OSGB36', () => {
      expect(getCoordinateSystemText(COORDINATE_SYSTEMS.OSGB36)).toBe(
        'OSGB36 (National Grid)\nEastings and Northings'
      )
    })

    test('returns text for WGS84', () => {
      expect(getCoordinateSystemText(COORDINATE_SYSTEMS.WGS84)).toBe(
        'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
      )
    })

    test('returns blank when no coordinate system', () => {
      expect(getCoordinateSystemText()).toBe('')
    })
  })

  describe('getCoordinateDisplayText', () => {
    test('returns text for WGS84', () => {
      expect(
        getCoordinateDisplayText(
          { coordinates: { latitude: '51.5074', longitude: '-0.1278' } },
          COORDINATE_SYSTEMS.WGS84
        )
      ).toBe('51.5074, -0.1278')
    })

    test('returns text for OSGB36', () => {
      expect(
        getCoordinateDisplayText(
          { coordinates: { easting: '425053', northing: '564180' } },
          COORDINATE_SYSTEMS.OSGB36
        )
      ).toBe('425053, 564180')
    })

    test('returns blank when site details blank', () => {
      expect(getCoordinateDisplayText({}, COORDINATE_SYSTEMS.OSGB36)).toBe('')
    })

    test('returns blank when no coordinate system', () => {
      expect(getCoordinateDisplayText({})).toBe('')
    })
  })

  describe('getPolygonCoordinatesDisplayData', () => {
    test('correctly formats valid WGS84 coordinates', () => {
      const siteDetails = {
        coordinates: [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '51.5084', longitude: '-0.1288' },
          { latitude: '51.5094', longitude: '-0.1298' }
        ]
      }

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '51.5074, -0.1278' },
        { label: 'Point 2', value: '51.5084, -0.1288' },
        { label: 'Point 3', value: '51.5094, -0.1298' }
      ])
    })

    test('correctly formats valid OSGB36 coordinates', () => {
      const siteDetails = {
        coordinates: [
          { easting: '425053', northing: '564180' },
          { easting: '425063', northing: '564190' }
        ]
      }

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        COORDINATE_SYSTEMS.OSGB36
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '425053, 564180' },
        { label: 'Point 2', value: '425063, 564190' }
      ])
    })

    test('filters out falsy coordinates', () => {
      const siteDetails = {
        coordinates: [
          { latitude: '51.5074', longitude: '-0.1278' },
          null,
          undefined,
          { latitude: '51.5084', longitude: '-0.1288' },
          '',
          { latitude: '51.5094', longitude: '-0.1298' }
        ]
      }

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '51.5074, -0.1278' },
        { label: 'Point 2', value: '51.5084, -0.1288' },
        { label: 'Point 3', value: '51.5094, -0.1298' }
      ])
    })

    test('filters out incomplete coordinates for WGS84', () => {
      const siteDetails = {
        coordinates: [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '51.5084' },
          { longitude: '-0.1288' },
          { latitude: '51.5094', longitude: '-0.1298' }
        ]
      }

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '51.5074, -0.1278' },
        { label: 'Point 2', value: '51.5094, -0.1298' }
      ])
    })

    test('filters out incomplete coordinates for OSGB36', () => {
      const siteDetails = {
        coordinates: [
          { easting: '425053', northing: '564180' },
          { easting: '425063' },
          { northing: '564190' },
          { easting: '425073', northing: '564200' }
        ]
      }

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        COORDINATE_SYSTEMS.OSGB36
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '425053, 564180' },
        { label: 'Point 2', value: '425073, 564200' }
      ])
    })

    test('returns empty array when site details invalid', () => {
      expect(
        getPolygonCoordinatesDisplayData(null, COORDINATE_SYSTEMS.WGS84)
      ).toEqual([])
      expect(
        getPolygonCoordinatesDisplayData({}, COORDINATE_SYSTEMS.WGS84)
      ).toEqual([])
      expect(
        getPolygonCoordinatesDisplayData(
          { coordinates: null },
          COORDINATE_SYSTEMS.WGS84
        )
      ).toEqual([])
    })

    test('returns empty array when coordinate system invalid', () => {
      const siteDetails = {
        coordinates: [{ latitude: '51.5074', longitude: '-0.1278' }]
      }

      expect(getPolygonCoordinatesDisplayData(siteDetails, null)).toEqual([])
      expect(getPolygonCoordinatesDisplayData(siteDetails, undefined)).toEqual(
        []
      )
    })
  })

  describe('getReviewSummaryText', () => {
    test('returns circular site text for single coordinatesEntry', () => {
      expect(
        getReviewSummaryText({
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates'
        })
      ).toBe(
        'Manually enter one set of coordinates and a width to create a circular site'
      )
    })

    test('returns polygon site text for multiple coordinatesEntry', () => {
      expect(
        getReviewSummaryText({
          coordinatesEntry: 'multiple',
          coordinatesType: 'coordinates'
        })
      ).toBe(
        'Enter multiple sets of coordinates to mark the boundary of the site'
      )
    })

    test('returns blank otherwise', () => {
      expect(getReviewSummaryText({})).toBe('')
    })
  })

  describe('buildManualCoordinateSummaryData', () => {
    test('builds summary data for a circular site', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test activity description',
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          circleWidth: '1',
          siteName: 'Test Site 1'
        }
      ]

      const result = buildManualCoordinateSummaryData(siteDetails, {})

      expect(result).toEqual([
        {
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description',
          method:
            'Manually enter one set of coordinates and a width to create a circular site',
          showActivityDates: true,
          showActivityDescription: true,
          siteName: 'Test Site 1',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
          coordinates: '51.5074, -0.1278',
          width: '1 metre',
          siteNumber: 1,
          siteDetailsData: expect.stringContaining(
            '"coordinatesType":"coordinates"'
          ),
          activityDetails: []
        }
      ])
    })

    test('builds summary data for a polygon site', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'multiple',
          coordinatesType: 'coordinates',
          coordinates: [
            { latitude: '51.5074', longitude: '-0.1278' },
            { latitude: '51.5084', longitude: '-0.1288' }
          ],
          siteName: 'Test Site 2'
        }
      ]

      const result = buildManualCoordinateSummaryData(siteDetails, {})

      expect(result[0]).toMatchObject({
        method:
          'Enter multiple sets of coordinates to mark the boundary of the site',
        polygonCoordinates: [
          { label: 'Start and end points', value: '51.5074, -0.1278' },
          { label: 'Point 2', value: '51.5084, -0.1288' }
        ],
        siteNumber: 1
      })
    })

    test('hides activity dates when same for all sites in multi-site journey', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: { latitude: '51.5074', longitude: '-0.1278' },
          circleWidth: '1',
          siteName: 'Test Site',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test description'
        }
      ]

      const result = buildManualCoordinateSummaryData(siteDetails, {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes',
        sameActivityDescription: 'yes'
      })

      expect(result[0].activityDates).toBe('')
      expect(result[0].activityDescription).toBe('')
      expect(result[0].showActivityDates).toBe(false)
      expect(result[0].showActivityDescription).toBe(false)
    })

    test('handles OSGB36 coordinates', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: { easting: '425053', northing: '564180' },
          circleWidth: '200',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test',
          siteName: 'Test Site 3'
        }
      ]

      const result = buildManualCoordinateSummaryData(siteDetails, {})

      expect(result[0]).toMatchObject({
        coordinateSystem: 'OSGB36 (National Grid)\nEastings and Northings',
        coordinates: '425053, 564180',
        width: '200 metres'
      })
    })

    test('handles missing optional data', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: { latitude: '51.5074', longitude: '-0.1278' },
          siteName: 'Test Site'
        }
      ]

      const result = buildManualCoordinateSummaryData(siteDetails, {
        multipleSitesEnabled: true,
        sameActivityDates: 'no'
      })

      expect(result[0].activityDates).toBe('')
      expect(result[0].activityDescription).toBe('')
      expect(result[0].width).toBe('')
    })

    test('returns empty array for invalid input', () => {
      expect(buildManualCoordinateSummaryData(null, {})).toEqual([])
      expect(buildManualCoordinateSummaryData(undefined, {})).toEqual([])
      expect(buildManualCoordinateSummaryData('not-array', {})).toEqual([])
    })

    test('includes parsed activityDetails when site has activities', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: { latitude: '51.5074', longitude: '-0.1278' },
          circleWidth: '100',
          siteName: 'Test Site',
          activityDetails: [mockActivityDetails]
        }
      ]

      const result = buildManualCoordinateSummaryData(siteDetails, {})

      expect(result[0].activityDetails).toHaveLength(1)
      expect(result[0].activityDetails[0]).toMatchObject({
        activitySubType: 'Construction of new works',
        activityDuration: '1 year, 4 months',
        completionDate: 'Test completion',
        activityMonths: 'Test months'
      })
    })
  })
})
