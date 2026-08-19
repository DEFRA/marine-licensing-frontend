import {
  extractSiteNameFromFeature,
  withExtractedSiteName
} from '#src/server/common/helpers/file-upload/extract-site-name.js'

const polygonFeature = (properties) => ({
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [] },
  properties
})

describe('#extractSiteNameFromFeature', () => {
  test('reads properties.name from the backend GeoJSON', () => {
    expect(
      extractSiteNameFromFeature(polygonFeature({ name: 'North Harbour' }))
    ).toBe('North Harbour')
  })

  test('returns null when name is missing', () => {
    expect(extractSiteNameFromFeature(polygonFeature({}))).toBeNull()
  })

  test('returns null when name is blank', () => {
    expect(
      extractSiteNameFromFeature(polygonFeature({ name: '   ' }))
    ).toBeNull()
  })

  test('does not look up shapefile column names', () => {
    expect(
      extractSiteNameFromFeature(polygonFeature({ Site_name: 'East Pier' }))
    ).toBeNull()
  })

  test('returns null when feature has no properties', () => {
    expect(extractSiteNameFromFeature({ type: 'Feature' })).toBeNull()
    expect(extractSiteNameFromFeature(null)).toBeNull()
  })
})

describe('#withExtractedSiteName', () => {
  test('sets siteName from the feature when present', () => {
    const result = withExtractedSiteName(
      { coordinatesType: 'file' },
      polygonFeature({ name: 'Harbour' })
    )

    expect(result.siteName).toBe('Harbour')
  })

  test('omits siteName when the feature has no name', () => {
    const result = withExtractedSiteName(
      { coordinatesType: 'file', siteName: 'Previous name' },
      polygonFeature({})
    )

    expect(result.siteName).toBeUndefined()
  })

  test('keeps the existing siteName when preserveExisting is true and the feature has no name', () => {
    const result = withExtractedSiteName(
      { coordinatesType: 'file', siteName: 'Previous name' },
      polygonFeature({}),
      { preserveExisting: true }
    )

    expect(result.siteName).toBe('Previous name')
  })

  test('overwrites the existing siteName when the feature has a name', () => {
    const result = withExtractedSiteName(
      { coordinatesType: 'file', siteName: 'Previous name' },
      polygonFeature({ name: 'New name' }),
      { preserveExisting: true }
    )

    expect(result.siteName).toBe('New name')
  })
})
