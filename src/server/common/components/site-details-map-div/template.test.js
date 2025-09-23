import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('Site Details Map Div Component', () => {
  test('should render map div with site details data attribute', () => {
    const siteDetailsData = JSON.stringify({
      coordinatesType: 'coordinates',
      coordinateSystem: 'wgs84',
      coordinatesEntry: 'single',
      coordinates: [{ latitude: '51.123456', longitude: '-1.123456' }],
      circleWidth: '100'
    })

    const $ = renderComponent('site-details-map-div', {
      siteDetailsData
    })

    const mapDiv = $('.app-site-details-map')
    expect(mapDiv).toHaveLength(1)
    expect(mapDiv.attr('data-module')).toBe('site-details-map')
    expect(mapDiv.attr('data-site-details')).toBe(siteDetailsData)
  })

  test('should render map div with polygon coordinates', () => {
    const siteDetailsData = JSON.stringify({
      coordinatesType: 'coordinates',
      coordinateSystem: 'wgs84',
      coordinatesEntry: 'multiple',
      coordinates: [
        { latitude: '51.123456', longitude: '-1.123456' },
        { latitude: '51.234567', longitude: '-1.234567' },
        { latitude: '51.345678', longitude: '-1.345678' }
      ]
    })

    const $ = renderComponent('site-details-map-div', {
      siteDetailsData
    })

    const mapDiv = $('.app-site-details-map')
    expect(mapDiv).toHaveLength(1)
    expect(mapDiv.attr('data-site-details')).toBe(siteDetailsData)
  })

  test('should render map div with file upload data', () => {
    const siteDetailsData = JSON.stringify({
      coordinatesType: 'file',
      geoJSON: { type: 'FeatureCollection', features: [] },
      fileUploadType: 'kml',
      uploadedFile: { filename: 'test.kml' }
    })

    const $ = renderComponent('site-details-map-div', {
      siteDetailsData
    })

    const mapDiv = $('.app-site-details-map')
    expect(mapDiv).toHaveLength(1)
    expect(mapDiv.attr('data-site-details')).toBe(siteDetailsData)
  })

  test('should handle empty site details data', () => {
    const siteDetailsData = JSON.stringify({
      coordinatesType: 'none',
      coordinateSystem: null
    })

    const $ = renderComponent('site-details-map-div', {
      siteDetailsData
    })

    const mapDiv = $('.app-site-details-map')
    expect(mapDiv).toHaveLength(1)
    expect(mapDiv.attr('data-site-details')).toBe(siteDetailsData)
  })

  test('should escape JSON data properly in attribute', () => {
    const siteDetailsData = JSON.stringify({
      coordinatesType: 'coordinates',
      testField: 'value with "quotes" and \'apostrophes\''
    })

    const $ = renderComponent('site-details-map-div', {
      siteDetailsData
    })

    const mapDiv = $('.app-site-details-map')
    expect(mapDiv).toHaveLength(1)

    // The data should be properly escaped and parseable
    const retrievedData = mapDiv.attr('data-site-details')
    expect(() => JSON.parse(retrievedData)).not.toThrow()
    expect(JSON.parse(retrievedData).testField).toBe(
      'value with "quotes" and \'apostrophes\''
    )
  })
})
