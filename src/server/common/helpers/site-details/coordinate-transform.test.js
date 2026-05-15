import { describe, test, expect } from 'vitest'
import { transformCoordinatesForApi } from './coordinate-transform.js'

describe('transformCoordinatesForApi', () => {
  test('renames eastings/northings to easting/northing for OSGB36 centre coordinates', () => {
    const result = transformCoordinatesForApi([
      {
        coordinatesType: 'coordinates',
        coordinates: { eastings: '532000', northings: '182000' }
      }
    ])

    expect(result[0].coordinates).toEqual({
      easting: '532000',
      northing: '182000'
    })
  })

  test('leaves array coordinates (multiple-coordinates path) unchanged', () => {
    const coordinates = [
      { easting: '530000', northing: '181000' },
      { easting: '530100', northing: '181100' },
      { easting: '530200', northing: '181200' }
    ]
    const result = transformCoordinatesForApi([
      { coordinatesType: 'coordinates', coordinates }
    ])

    expect(result[0].coordinates).toBe(coordinates)
  })

  test('leaves WGS84 coordinates unchanged', () => {
    const result = transformCoordinatesForApi([
      {
        coordinatesType: 'coordinates',
        coordinates: { latitude: '51.5074', longitude: '-0.1278' }
      }
    ])

    expect(result[0].coordinates).toEqual({
      latitude: '51.5074',
      longitude: '-0.1278'
    })
  })

  test('leaves sites without a coordinates field unchanged', () => {
    const site = { coordinatesType: 'coordinates', siteName: 'Test' }
    const result = transformCoordinatesForApi([site])

    expect(result[0]).toBe(site)
  })

  test('preserves all other site fields when transforming coordinates', () => {
    const result = transformCoordinatesForApi([
      {
        coordinatesType: 'coordinates',
        coordinatesEntry: 'single',
        siteName: 'My site',
        circleWidth: '100',
        coordinates: { eastings: '532000', northings: '182000' }
      }
    ])

    expect(result[0]).toMatchObject({
      coordinatesType: 'coordinates',
      coordinatesEntry: 'single',
      siteName: 'My site',
      circleWidth: '100',
      coordinates: { easting: '532000', northing: '182000' }
    })
  })
})
