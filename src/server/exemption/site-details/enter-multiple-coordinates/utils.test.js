import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay
} from './utils.js'

describe('enter-multiple-coordinates utils', () => {
  describe('MULTIPLE_COORDINATES_VIEW_ROUTES', () => {
    it('should provide correct route mappings for coordinate systems', () => {
      expect(MULTIPLE_COORDINATES_VIEW_ROUTES).toEqual({
        [COORDINATE_SYSTEMS.WGS84]:
          'exemption/site-details/enter-multiple-coordinates/wgs84',
        [COORDINATE_SYSTEMS.OSGB36]:
          'exemption/site-details/enter-multiple-coordinates/osgb36'
      })
    })

    it('should have routes for all coordinate systems', () => {
      expect(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84]
      ).toBeDefined()
      expect(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36]
      ).toBeDefined()
    })
  })

  describe('normaliseCoordinatesForDisplay', () => {
    describe('WGS84 coordinate system', () => {
      it('should return 3 empty coordinates when no coordinates provided', () => {
        const result = normaliseCoordinatesForDisplay(
          [],
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should return 3 empty coordinates when coordinates is null', () => {
        const result = normaliseCoordinatesForDisplay(
          null,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should return 3 empty coordinates when coordinates is undefined', () => {
        const result = normaliseCoordinatesForDisplay(
          undefined,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should pad with empty coordinates when only 1 coordinate provided', () => {
        const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should pad with empty coordinates when only 2 coordinates provided', () => {
        const coordinates = [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should return exactly 3 coordinates when 3 coordinates provided', () => {
        const coordinates = [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' },
          { latitude: '53.4808', longitude: '-2.2426' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual(coordinates)
      })

      it('should truncate to 3 coordinates when more than 3 provided', () => {
        const coordinates = [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' },
          { latitude: '53.4808', longitude: '-2.2426' },
          { latitude: '54.9783', longitude: '-1.6178' },
          { latitude: '55.9533', longitude: '-3.1883' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' },
          { latitude: '53.4808', longitude: '-2.2426' }
        ])
      })

      it('should handle coordinates with partial data', () => {
        const coordinates = [
          { latitude: '51.5074', longitude: '' },
          { latitude: '', longitude: '-1.8904' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '51.5074', longitude: '' },
          { latitude: '', longitude: '-1.8904' },
          { latitude: '', longitude: '' }
        ])
      })
    })

    describe('OSGB36 coordinate system', () => {
      it('should return 3 empty coordinates when no coordinates provided', () => {
        const result = normaliseCoordinatesForDisplay(
          [],
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '', northings: '' },
          { eastings: '', northings: '' },
          { eastings: '', northings: '' }
        ])
      })

      it('should return 3 empty coordinates when coordinates is null', () => {
        const result = normaliseCoordinatesForDisplay(
          null,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '', northings: '' },
          { eastings: '', northings: '' },
          { eastings: '', northings: '' }
        ])
      })

      it('should pad with empty coordinates when only 1 coordinate provided', () => {
        const coordinates = [{ eastings: '529090', northings: '181680' }]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '529090', northings: '181680' },
          { eastings: '', northings: '' },
          { eastings: '', northings: '' }
        ])
      })

      it('should pad with empty coordinates when only 2 coordinates provided', () => {
        const coordinates = [
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' },
          { eastings: '', northings: '' }
        ])
      })

      it('should return exactly 3 coordinates when 3 coordinates provided', () => {
        const coordinates = [
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' },
          { eastings: '383500', northings: '398000' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual(coordinates)
      })

      it('should truncate to 3 coordinates when more than 3 provided', () => {
        const coordinates = [
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' },
          { eastings: '383500', northings: '398000' },
          { eastings: '424000', northings: '565000' },
          { eastings: '325000', northings: '673000' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' },
          { eastings: '383500', northings: '398000' }
        ])
      })

      it('should handle coordinates with partial data', () => {
        const coordinates = [
          { eastings: '529090', northings: '' },
          { eastings: '', northings: '286550' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '529090', northings: '' },
          { eastings: '', northings: '286550' },
          { eastings: '', northings: '' }
        ])
      })
    })

    describe('edge cases', () => {
      it('should handle empty array for WGS84', () => {
        const result = normaliseCoordinatesForDisplay(
          [],
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(
          result.every(
            (coord) => coord.latitude === '' && coord.longitude === ''
          )
        ).toBe(true)
      })

      it('should handle empty array for OSGB36', () => {
        const result = normaliseCoordinatesForDisplay(
          [],
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(
          result.every(
            (coord) => coord.eastings === '' && coord.northings === ''
          )
        ).toBe(true)
      })

      it('should preserve existing coordinate data structure', () => {
        const coordinates = [
          {
            latitude: '51.5074',
            longitude: '-0.1278',
            additionalProperty: 'test'
          }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result[0]).toEqual({
          latitude: '51.5074',
          longitude: '-0.1278',
          additionalProperty: 'test'
        })
      })

      it('should handle mixed coordinate systems gracefully', () => {
        const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result[0]).toEqual({ latitude: '51.5074', longitude: '-0.1278' })
        expect(result[1]).toEqual({ eastings: '', northings: '' })
        expect(result[2]).toEqual({ eastings: '', northings: '' })
      })
    })
  })
})
