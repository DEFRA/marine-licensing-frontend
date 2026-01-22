import { vi } from 'vitest'
import {
  extractCoordinatesFromGeoJSON,
  getCoordinateSystem
} from '#src/server/common/helpers/coordinate-utils.js'
import { getExemptionCache } from './exemptions/session-cache/utils.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'

// Mock the session cache utils
vi.mock('./exemptions/session-cache/utils.js')

describe('coordinate-utils', () => {
  describe('extractCoordinatesFromGeoJSON', () => {
    test('should extract coordinates from valid GeoJSON with Polygon feature', () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-1.3995, 55.019889],
                  [-1.399, 55.019889],
                  [-1.399, 55.02],
                  [-1.3995, 55.02],
                  [-1.3995, 55.019889]
                ]
              ]
            }
          }
        ]
      }

      const result = extractCoordinatesFromGeoJSON(geoJSON)

      expect(result).toEqual([
        {
          type: 'Polygon',
          coordinates: [
            [
              [-1.3995, 55.019889],
              [-1.399, 55.019889],
              [-1.399, 55.02],
              [-1.3995, 55.02],
              [-1.3995, 55.019889]
            ]
          ]
        }
      ])
    })

    test('should extract coordinates from GeoJSON with Point feature', () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-1.3995, 55.019889]
            }
          }
        ]
      }

      const result = extractCoordinatesFromGeoJSON(geoJSON)

      expect(result).toEqual([
        {
          type: 'Point',
          coordinates: [-1.3995, 55.019889]
        }
      ])
    })

    test('should extract coordinates from GeoJSON with multiple features', () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-1.3995, 55.019889]
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [-1.3995, 55.019889],
                [-1.399, 55.02]
              ]
            }
          }
        ]
      }

      const result = extractCoordinatesFromGeoJSON(geoJSON)

      expect(result).toEqual([
        {
          type: 'Point',
          coordinates: [-1.3995, 55.019889]
        },
        {
          type: 'LineString',
          coordinates: [
            [-1.3995, 55.019889],
            [-1.399, 55.02]
          ]
        }
      ])
    })

    test('should skip features without geometry', () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Feature without geometry' }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-1.3995, 55.019889]
            }
          }
        ]
      }

      const result = extractCoordinatesFromGeoJSON(geoJSON)

      expect(result).toEqual([
        {
          type: 'Point',
          coordinates: [-1.3995, 55.019889]
        }
      ])
    })

    test('should skip features without coordinates', () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point'
              // missing coordinates
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-1.3995, 55.019889]
            }
          }
        ]
      }

      const result = extractCoordinatesFromGeoJSON(geoJSON)

      expect(result).toEqual([
        {
          type: 'Point',
          coordinates: [-1.3995, 55.019889]
        }
      ])
    })

    test('should return empty array for null or undefined geoJSON', () => {
      expect(extractCoordinatesFromGeoJSON(null)).toEqual([])
      expect(extractCoordinatesFromGeoJSON(undefined)).toEqual([])
    })

    test('should return empty array for geoJSON without features', () => {
      const geoJSON = {
        type: 'FeatureCollection'
        // missing features
      }

      const result = extractCoordinatesFromGeoJSON(geoJSON)

      expect(result).toEqual([])
    })

    test('should return empty array for geoJSON with empty features array', () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: []
      }

      const result = extractCoordinatesFromGeoJSON(geoJSON)

      expect(result).toEqual([])
    })

    test('should handle features with null geometry', () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: null
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-1.3995, 55.019889]
            }
          }
        ]
      }

      const result = extractCoordinatesFromGeoJSON(geoJSON)

      expect(result).toEqual([
        {
          type: 'Point',
          coordinates: [-1.3995, 55.019889]
        }
      ])
    })
  })

  describe('getCoordinateSystem', () => {
    const mockRequest = {}
    const mockGetExemptionCache = vi.mocked(getExemptionCache)

    test('should return OSGB36 when coordinate system is set to OSGB36 in cache', () => {
      mockGetExemptionCache.mockReturnValue({
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.OSGB36
          }
        ]
      })

      const result = getCoordinateSystem(mockRequest)

      expect(result).toEqual({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })
      expect(mockGetExemptionCache).toHaveBeenCalledWith(mockRequest)
    })

    test('should return WGS84 when coordinate system is set to WGS84 in cache', () => {
      mockGetExemptionCache.mockReturnValue({
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84
          }
        ]
      })

      const result = getCoordinateSystem(mockRequest)

      expect(result).toEqual({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
      expect(mockGetExemptionCache).toHaveBeenCalledWith(mockRequest)
    })

    test('should default to WGS84 when coordinate system is not set in cache', () => {
      mockGetExemptionCache.mockReturnValue({
        siteDetails: [{}]
      })

      const result = getCoordinateSystem(mockRequest)

      expect(result).toEqual({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
      expect(mockGetExemptionCache).toHaveBeenCalledWith(mockRequest)
    })

    test('should default to WGS84 when siteDetails is not present in cache', () => {
      mockGetExemptionCache.mockReturnValue({})

      const result = getCoordinateSystem(mockRequest)

      expect(result).toEqual({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
      expect(mockGetExemptionCache).toHaveBeenCalledWith(mockRequest)
    })

    test('should default to WGS84 when cache is empty', () => {
      mockGetExemptionCache.mockReturnValue({})

      const result = getCoordinateSystem(mockRequest)

      expect(result).toEqual({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
      expect(mockGetExemptionCache).toHaveBeenCalledWith(mockRequest)
    })

    test('should default to WGS84 when coordinate system has an invalid value', () => {
      mockGetExemptionCache.mockReturnValue({
        siteDetails: [
          {
            coordinateSystem: 'invalid-system'
          }
        ]
      })

      const result = getCoordinateSystem(mockRequest)

      expect(result).toEqual({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
      expect(mockGetExemptionCache).toHaveBeenCalledWith(mockRequest)
    })

    test('should default to WGS84 when coordinate system is null', () => {
      mockGetExemptionCache.mockReturnValue({
        siteDetails: [
          {
            coordinateSystem: null
          }
        ]
      })

      const result = getCoordinateSystem(mockRequest)

      expect(result).toEqual({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
      expect(mockGetExemptionCache).toHaveBeenCalledWith(mockRequest)
    })

    test('should default to WGS84 when coordinate system is undefined', () => {
      mockGetExemptionCache.mockReturnValue({
        siteDetails: [
          {
            coordinateSystem: undefined
          }
        ]
      })

      const result = getCoordinateSystem(mockRequest)

      expect(result).toEqual({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
      expect(mockGetExemptionCache).toHaveBeenCalledWith(mockRequest)
    })
  })
})
