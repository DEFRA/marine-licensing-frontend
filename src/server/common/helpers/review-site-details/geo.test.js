import {
  extractCoordinateData,
  hasValidGeometry,
  parseGeoJSONCoordinates
} from '#src/server/common/helpers/review-site-details/geo.js'

describe('hasValidGeometry', () => {
  test('returns true for a feature with valid Point geometry', () => {
    const feature = {
      geometry: { type: 'Point', coordinates: [51.5074, -0.1278] }
    }
    expect(hasValidGeometry(feature)).toBe(true)
  })

  test('returns true for a feature with valid Polygon geometry', () => {
    const feature = {
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0]
          ]
        ]
      }
    }
    expect(hasValidGeometry(feature)).toBe(true)
  })

  test('returns false when geometry is null', () => {
    expect(hasValidGeometry({ geometry: null })).toBeFalsy()
  })

  test('returns false when geometry has no type', () => {
    expect(
      hasValidGeometry({ geometry: { coordinates: [51.5074, -0.1278] } })
    ).toBeFalsy()
  })

  test('returns false when geometry has no coordinates', () => {
    expect(hasValidGeometry({ geometry: { type: 'Point' } })).toBeFalsy()
  })

  test('returns false when geometry coordinates is not an array', () => {
    expect(
      hasValidGeometry({ geometry: { type: 'Point', coordinates: 'invalid' } })
    ).toBeFalsy()
  })

  test('returns false when geometry coordinates is an empty array', () => {
    expect(
      hasValidGeometry({ geometry: { type: 'Point', coordinates: [] } })
    ).toBeFalsy()
  })
})

describe('extractCoordinateData', () => {
  test('extracts type and coordinates from a Point feature', () => {
    const feature = {
      geometry: { type: 'Point', coordinates: [51.5074, -0.1278] }
    }
    expect(extractCoordinateData(feature)).toEqual({
      type: 'Point',
      coordinates: [51.5074, -0.1278]
    })
  })

  test('extracts type and coordinates from a LineString feature', () => {
    const feature = {
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
          [2, 2]
        ]
      }
    }
    expect(extractCoordinateData(feature)).toEqual({
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2]
      ]
    })
  })
})

describe('parseGeoJSONCoordinates', () => {
  test('returns empty array when geoJSON has no features', () => {
    expect(parseGeoJSONCoordinates({})).toEqual([])
  })

  test('returns empty array when features is not an array', () => {
    expect(parseGeoJSONCoordinates({ features: 'invalid' })).toEqual([])
  })

  test('returns empty array when features array is empty', () => {
    expect(parseGeoJSONCoordinates({ features: [] })).toEqual([])
  })

  test('parses coordinates from multiple features', () => {
    const geoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [51.5074, -0.1278] }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
                [0, 0]
              ]
            ]
          }
        }
      ]
    }

    expect(parseGeoJSONCoordinates(geoJSON)).toEqual([
      { type: 'Point', coordinates: [51.5074, -0.1278] },
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0]
          ]
        ]
      }
    ])
  })

  test('filters out features with invalid geometry', () => {
    const geoJSON = {
      features: [
        {
          geometry: { type: 'Point', coordinates: [51.5074, -0.1278] }
        },
        {
          geometry: null
        },
        {
          geometry: { type: 'Point', coordinates: [] }
        }
      ]
    }

    expect(parseGeoJSONCoordinates(geoJSON)).toEqual([
      { type: 'Point', coordinates: [51.5074, -0.1278] }
    ])
  })
})
