import { validateAndExtractGeoJSON } from '#src/server/common/helpers/file-upload/geo-parse-upload.js'

describe('#validateAndExtractGeoJSON', () => {
  const buildGeoJSON = (featureCount = 1) => ({
    type: 'FeatureCollection',
    features: Array.from({ length: featureCount }, (_, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [i + 1, i + 2] }
    }))
  })

  test('should return GeoJSON from a valid success response', () => {
    const geoJSON = buildGeoJSON(1)
    const response = { payload: { message: 'success', value: geoJSON } }

    expect(validateAndExtractGeoJSON(response)).toBe(geoJSON)
  })

  test('should return GeoJSON with multiple features from a valid success response', () => {
    const geoJSON = buildGeoJSON(3)
    const response = { payload: { message: 'success', value: geoJSON } }

    const result = validateAndExtractGeoJSON(response)
    expect(result.features).toHaveLength(3)
  })

  test('should throw when payload message is not success', () => {
    const response = {
      payload: { message: 'error', error: 'Could not parse file' }
    }

    expect(() => validateAndExtractGeoJSON(response)).toThrow(
      'Invalid geo-parser response'
    )
  })

  test('should throw when payload message is absent', () => {
    const response = {
      statusCode: 400,
      payload: { error: 'Invalid file format' }
    }

    expect(() => validateAndExtractGeoJSON(response)).toThrow(
      'Invalid geo-parser response'
    )
  })

  test('should throw when GeoJSON is missing features array', () => {
    const response = {
      payload: {
        message: 'success',
        value: { type: 'FeatureCollection' }
      }
    }

    expect(() => validateAndExtractGeoJSON(response)).toThrow(
      'Invalid GeoJSON structure'
    )
  })

  test('should throw when GeoJSON value is null', () => {
    const response = { payload: { message: 'success', value: null } }

    expect(() => validateAndExtractGeoJSON(response)).toThrow(
      'Invalid GeoJSON structure'
    )
  })
})
