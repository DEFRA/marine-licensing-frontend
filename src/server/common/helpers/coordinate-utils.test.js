import { extractCoordinatesFromGeoJSON } from '~/src/server/common/helpers/coordinate-utils.js'

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
})
