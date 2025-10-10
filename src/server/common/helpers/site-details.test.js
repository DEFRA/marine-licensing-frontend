import {
  COORDINATE_ERROR_MESSAGES,
  generatePointSpecificErrorMessage,
  createSiteDetailsDataJson
} from './site-details.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'

describe('site-details helper', () => {
  describe('COORDINATE_ERROR_MESSAGES', () => {
    test('should contain WGS84 error messages', () => {
      expect(COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.WGS84]).toBeDefined()
      expect(
        COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.WGS84].LATITUDE_REQUIRED
      ).toBe('Enter the latitude')
      expect(
        COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.WGS84].LONGITUDE_REQUIRED
      ).toBe('Enter the longitude')
    })

    test('should contain OSGB36 error messages', () => {
      expect(COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.OSGB36]).toBeDefined()
      expect(
        COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.OSGB36].EASTINGS_REQUIRED
      ).toBe('Enter the eastings')
      expect(
        COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.OSGB36].NORTHINGS_REQUIRED
      ).toBe('Enter the northings')
    })
  })

  describe('generatePointSpecificErrorMessage', () => {
    test('should generate correct message for start and end point (index 0)', () => {
      const result = generatePointSpecificErrorMessage('Enter the latitude', 0)
      expect(result).toBe('Enter the latitude of start and end point')
    })

    test('should generate correct message for point 2 (index 1)', () => {
      const result = generatePointSpecificErrorMessage('Enter the longitude', 1)
      expect(result).toBe('Enter the longitude of point 2')
    })

    test('should generate correct message for point 3 (index 2)', () => {
      const result = generatePointSpecificErrorMessage(
        'Eastings must be 6 digits',
        2
      )
      expect(result).toBe('Eastings of point 3 must be 6 digits')
    })

    test('should return original message if no mapping found', () => {
      const originalMessage = 'Some unknown error message'
      const result = generatePointSpecificErrorMessage(originalMessage, 1)
      expect(result).toBe(originalMessage)
    })
  })

  describe('createSiteDetailsDataJson', () => {
    describe('file-based coordinates', () => {
      test('should create JSON for shapefile upload', () => {
        const siteDetails = {
          coordinatesType: 'file',
          geoJSON: {
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
          },
          fileUploadType: 'shapefile',
          uploadedFile: {
            filename: 'site-boundaries.zip',
            size: 12345
          }
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'file',
          geoJSON: siteDetails.geoJSON,
          fileUploadType: 'shapefile',
          uploadedFile: siteDetails.uploadedFile
        })
      })

      test('should create JSON for KML upload', () => {
        const siteDetails = {
          coordinatesType: 'file',
          geoJSON: {
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
          },
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'site-location.kml',
            size: 2048
          }
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.OSGB36
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'file',
          geoJSON: siteDetails.geoJSON,
          fileUploadType: 'kml',
          uploadedFile: siteDetails.uploadedFile
        })
      })

      test('should create JSON for GeoJSON upload', () => {
        const siteDetails = {
          coordinatesType: 'file',
          geoJSON: {
            type: 'FeatureCollection',
            features: [
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
          },
          fileUploadType: 'geojson',
          uploadedFile: {
            filename: 'route.geojson',
            size: 1024
          }
        }

        const result = createSiteDetailsDataJson(siteDetails)
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'file',
          geoJSON: siteDetails.geoJSON,
          fileUploadType: 'geojson',
          uploadedFile: siteDetails.uploadedFile
        })
      })

      test('should handle file upload with empty geoJSON', () => {
        const siteDetails = {
          coordinatesType: 'file',
          geoJSON: null,
          fileUploadType: 'shapefile',
          uploadedFile: {
            filename: 'empty-file.zip',
            size: 0
          }
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'file',
          geoJSON: null,
          fileUploadType: 'shapefile',
          uploadedFile: siteDetails.uploadedFile
        })
      })
    })

    describe('manual coordinates', () => {
      test('should create JSON for WGS84 single point coordinates', () => {
        const siteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinates: [
            {
              latitude: '55.019889',
              longitude: '-1.399500'
            }
          ],
          circleWidth: '100'
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'single',
          coordinates: siteDetails.coordinates,
          circleWidth: '100'
        })
      })

      test('should create JSON for OSGB36 single point coordinates', () => {
        const siteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinates: [
            {
              eastings: '354200',
              northings: '512400'
            }
          ],
          circleWidth: '50'
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.OSGB36
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
          coordinatesEntry: 'single',
          coordinates: siteDetails.coordinates,
          circleWidth: '50'
        })
      })

      test('should create JSON for WGS84 multiple point coordinates', () => {
        const siteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinates: [
            {
              latitude: '55.019889',
              longitude: '-1.399500'
            },
            {
              latitude: '55.020000',
              longitude: '-1.399000'
            },
            {
              latitude: '55.020100',
              longitude: '-1.399100'
            }
          ]
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'multiple',
          coordinates: siteDetails.coordinates,
          circleWidth: undefined
        })
      })

      test('should create JSON for OSGB36 multiple point coordinates', () => {
        const siteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinates: [
            {
              eastings: '354200',
              northings: '512400'
            },
            {
              eastings: '354250',
              northings: '512450'
            },
            {
              eastings: '354300',
              northings: '512500'
            },
            {
              eastings: '354200',
              northings: '512400'
            }
          ]
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.OSGB36
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
          coordinatesEntry: 'multiple',
          coordinates: siteDetails.coordinates,
          circleWidth: undefined
        })
      })

      test('should handle coordinates without circleWidth', () => {
        const siteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinates: [
            {
              latitude: '55.019889',
              longitude: '-1.399500'
            }
          ]
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'single',
          coordinates: siteDetails.coordinates,
          circleWidth: undefined
        })
      })

      test('should handle empty coordinates array', () => {
        const siteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinates: []
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'multiple',
          coordinates: [],
          circleWidth: undefined
        })
      })
    })

    describe('edge cases and validation', () => {
      test('should handle undefined coordinate system for manual coordinates', () => {
        const siteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinates: [
            {
              latitude: '55.019889',
              longitude: '-1.399500'
            }
          ],
          circleWidth: '100'
        }

        const result = createSiteDetailsDataJson(siteDetails, undefined)
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: undefined,
          coordinatesEntry: 'single',
          coordinates: siteDetails.coordinates,
          circleWidth: '100'
        })
      })

      test('should handle null coordinate system for manual coordinates', () => {
        const siteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinates: [
            {
              latitude: '55.019889',
              longitude: '-1.399500'
            }
          ],
          circleWidth: '100'
        }

        const result = createSiteDetailsDataJson(siteDetails, null)
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: null,
          coordinatesEntry: 'single',
          coordinates: siteDetails.coordinates,
          circleWidth: '100'
        })
      })

      test('should handle missing properties in site details for file upload', () => {
        const siteDetails = {
          coordinatesType: 'file'
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'file',
          geoJSON: undefined,
          fileUploadType: undefined,
          uploadedFile: undefined
        })
      })

      test('should handle missing properties in site details for manual coordinates', () => {
        const siteDetails = {
          coordinatesType: 'coordinates'
        }

        const result = createSiteDetailsDataJson(
          siteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'coordinates',
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: undefined,
          coordinates: undefined,
          circleWidth: undefined
        })
      })

      test('should handle null site details gracefully', () => {
        const result = createSiteDetailsDataJson(null, COORDINATE_SYSTEMS.WGS84)
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'none',
          coordinateSystem: null
        })
      })

      test('should handle undefined site details gracefully', () => {
        const result = createSiteDetailsDataJson(
          undefined,
          COORDINATE_SYSTEMS.WGS84
        )
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toEqual({
          coordinatesType: 'none',
          coordinateSystem: null
        })
      })

      test('should return valid JSON string for all scenarios', () => {
        const fileBasedSiteDetails = {
          coordinatesType: 'file',
          geoJSON: { type: 'FeatureCollection', features: [] },
          fileUploadType: 'shapefile',
          uploadedFile: { filename: 'test.zip', size: 1024 }
        }

        const coordinateBasedSiteDetails = {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinates: [{ latitude: '55.019889', longitude: '-1.399500' }],
          circleWidth: '100'
        }

        const fileResult = createSiteDetailsDataJson(
          fileBasedSiteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const coordinateResult = createSiteDetailsDataJson(
          coordinateBasedSiteDetails,
          COORDINATE_SYSTEMS.WGS84
        )
        const nullResult = createSiteDetailsDataJson(
          null,
          COORDINATE_SYSTEMS.WGS84
        )

        // Test that results are valid JSON strings
        expect(() => JSON.parse(fileResult)).not.toThrow()
        expect(() => JSON.parse(coordinateResult)).not.toThrow()
        expect(() => JSON.parse(nullResult)).not.toThrow()

        // Test that results are strings
        expect(typeof fileResult).toBe('string')
        expect(typeof coordinateResult).toBe('string')
        expect(typeof nullResult).toBe('string')
      })
    })
  })
})
