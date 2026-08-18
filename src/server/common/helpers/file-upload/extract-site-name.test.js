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
  describe('KML', () => {
    test('extracts the name property', () => {
      expect(
        extractSiteNameFromFeature(
          polygonFeature({ name: 'North Harbour' }),
          'kml'
        )
      ).toBe('North Harbour')
    })

    test('returns null when name is missing', () => {
      expect(extractSiteNameFromFeature(polygonFeature({}), 'kml')).toBeNull()
    })

    test('returns null when name is blank', () => {
      expect(
        extractSiteNameFromFeature(polygonFeature({ name: '   ' }), 'kml')
      ).toBeNull()
    })

    test('does not use shapefile column names', () => {
      expect(
        extractSiteNameFromFeature(
          polygonFeature({ Site_name: 'Should not use' }),
          'kml'
        )
      ).toBeNull()
    })
  })

  describe('shapefile', () => {
    test.each([
      [{ Site_name: 'North Harbour' }, 'North Harbour'],
      [{ Sitename: 'East Pier' }, 'East Pier'],
      [{ Name: 'West Dock' }, 'West Dock'],
      [{ SITE_NAME: 'Uppercase column' }, 'Uppercase column']
    ])('extracts from %j', (properties, expected) => {
      expect(
        extractSiteNameFromFeature(polygonFeature(properties), 'shapefile')
      ).toBe(expected)
    })

    test('prefers Site_name over Name', () => {
      expect(
        extractSiteNameFromFeature(
          polygonFeature({
            Name: 'Name column',
            Site_name: 'Site_name column'
          }),
          'shapefile'
        )
      ).toBe('Site_name column')
    })

    test('returns null when no recognised column has a value', () => {
      expect(
        extractSiteNameFromFeature(
          polygonFeature({ other: 'ignored' }),
          'shapefile'
        )
      ).toBeNull()
    })
  })

  test('returns null when feature has no properties', () => {
    expect(extractSiteNameFromFeature({ type: 'Feature' }, 'kml')).toBeNull()
    expect(extractSiteNameFromFeature(null, 'shapefile')).toBeNull()
  })

  test('returns null when properties is not an object', () => {
    expect(
      extractSiteNameFromFeature(
        { type: 'Feature', properties: 'invalid' },
        'kml'
      )
    ).toBeNull()
  })

  test('converts finite numeric names to strings', () => {
    expect(
      extractSiteNameFromFeature(polygonFeature({ name: 42 }), 'kml')
    ).toBe('42')
  })

  test('returns null for non-string, non-numeric values', () => {
    expect(
      extractSiteNameFromFeature(polygonFeature({ name: true }), 'kml')
    ).toBeNull()
    expect(
      extractSiteNameFromFeature(polygonFeature({ name: null }), 'kml')
    ).toBeNull()
  })

  test('returns null for non-finite numbers', () => {
    expect(
      extractSiteNameFromFeature(polygonFeature({ name: Infinity }), 'kml')
    ).toBeNull()
    expect(
      extractSiteNameFromFeature(polygonFeature({ name: NaN }), 'kml')
    ).toBeNull()
  })

  test('uses shapefile column names for unknown file types', () => {
    expect(
      extractSiteNameFromFeature(
        polygonFeature({ Site_name: 'Fallback site' }),
        'geojson'
      )
    ).toBe('Fallback site')
  })

  test('skips a blank recognised column and uses the next one', () => {
    expect(
      extractSiteNameFromFeature(
        polygonFeature({
          Site_name: '  ',
          Name: 'West Dock'
        }),
        'shapefile'
      )
    ).toBe('West Dock')
  })

  test('truncates names longer than 250 characters', () => {
    expect(
      extractSiteNameFromFeature(
        polygonFeature({ name: 'a'.repeat(251) }),
        'kml'
      )
    ).toBe('a'.repeat(250))
  })
})

describe('#withExtractedSiteName', () => {
  test('sets siteName from the feature when present', () => {
    const result = withExtractedSiteName(
      { coordinatesType: 'file' },
      polygonFeature({ name: 'Harbour' }),
      'kml'
    )

    expect(result.siteName).toBe('Harbour')
  })

  test('omits siteName when the feature has no name', () => {
    const result = withExtractedSiteName(
      { coordinatesType: 'file', siteName: 'Previous name' },
      polygonFeature({}),
      'kml'
    )

    expect(result.siteName).toBeUndefined()
  })

  test('keeps the existing siteName when preserveExisting is true and the feature has no name', () => {
    const result = withExtractedSiteName(
      { coordinatesType: 'file', siteName: 'Previous name' },
      polygonFeature({}),
      'kml',
      { preserveExisting: true }
    )

    expect(result.siteName).toBe('Previous name')
  })

  test('overwrites the existing siteName when the feature has a name', () => {
    const result = withExtractedSiteName(
      { coordinatesType: 'file', siteName: 'Previous name' },
      polygonFeature({ name: 'New name' }),
      'kml',
      { preserveExisting: true }
    )

    expect(result.siteName).toBe('New name')
  })
})
