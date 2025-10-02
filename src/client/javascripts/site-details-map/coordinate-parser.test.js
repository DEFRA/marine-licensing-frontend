import { vi } from 'vitest'
import CoordinateParser from './coordinate-parser.js'
import GeographicCoordinateConverter from './geographic-coordinate-converter.js'

vi.mock('./geographic-coordinate-converter.js', () => ({
  default: {
    osgb36ToWgs84: vi.fn()
  }
}))

describe('CoordinateParser', () => {
  let coordinateParser
  let mockFromLonLat

  beforeEach(() => {
    GeographicCoordinateConverter.osgb36ToWgs84 = vi.fn()
    coordinateParser = new CoordinateParser()
    mockFromLonLat = vi.fn()
  })

  const setupOSGB36Test = (webMercatorResult = [56000, 6708000]) => {
    const coordinates = { eastings: '577000', northings: '178000' }
    GeographicCoordinateConverter.osgb36ToWgs84.mockReturnValue([0.7, 51.55])
    mockFromLonLat.mockReturnValue(webMercatorResult)
    return coordinates
  }

  describe('coordinate system recognition', () => {
    test.each([
      {
        method: 'isWGS84CoordinateSystem',
        valid: ['WGS84', 'wgs84'],
        invalid: ['OSGB36', 'invalid']
      },
      {
        method: 'isOSGB36CoordinateSystem',
        valid: ['OSGB36', 'osgb36'],
        invalid: ['WGS84', 'invalid']
      }
    ])(
      '$method should recognise coordinate systems',
      ({ method, valid, invalid }) => {
        valid.forEach((input) => {
          expect(coordinateParser[method](input)).toBe(true)
        })
        invalid.forEach((input) => {
          expect(coordinateParser[method](input)).toBe(false)
        })
      }
    )
  })

  describe('coordinate validation', () => {
    test.each([
      {
        method: 'hasWGS84Coordinates',
        valid: { latitude: '51.5', longitude: '-0.1' },
        invalid: [{ latitude: '51.5' }, { longitude: '-0.1' }, {}]
      },
      {
        method: 'hasOSGB36Coordinates',
        valid: { eastings: '530000', northings: '180000' },
        invalid: [{ eastings: '530000' }, { northings: '180000' }, {}]
      }
    ])('$method should validate coordinates', ({ method, valid, invalid }) => {
      expect(coordinateParser[method](valid)).toBeTruthy()
      invalid.forEach((coords) => {
        expect(coordinateParser[method](coords)).toBeFalsy()
      })
    })
  })

  describe('parseCoordinates', () => {
    test('should return transformed coordinates for WGS84 input', () => {
      const coordinates = { latitude: '51.5', longitude: '-0.1' }
      mockFromLonLat.mockReturnValue([1000, 2000])

      const result = coordinateParser.parseCoordinates(
        'WGS84',
        coordinates,
        mockFromLonLat
      )

      expect(result).toEqual([1000, 2000])
    })

    test('should call transformation function with correct WGS84 parameters', () => {
      const coordinates = { latitude: '51.5', longitude: '-0.1' }
      mockFromLonLat.mockReturnValue([1000, 2000])

      coordinateParser.parseCoordinates('WGS84', coordinates, mockFromLonLat)

      expect(mockFromLonLat).toHaveBeenCalledWith([-0.1, 51.5])
    })

    test('should not use OSGB36 converter for WGS84 coordinates', () => {
      const coordinates = { latitude: '51.5', longitude: '-0.1' }
      mockFromLonLat.mockReturnValue([1000, 2000])

      coordinateParser.parseCoordinates('WGS84', coordinates, mockFromLonLat)

      expect(GeographicCoordinateConverter.osgb36ToWgs84).not.toHaveBeenCalled()
    })

    test('should return transformed coordinates for OSGB36 input', () => {
      const coordinates = setupOSGB36Test()

      const result = coordinateParser.parseCoordinates(
        'OSGB36',
        coordinates,
        mockFromLonLat
      )

      expect(result).toEqual([56000, 6708000])
    })

    test('should convert OSGB36 to WGS84 before transformation', () => {
      const coordinates = setupOSGB36Test()

      coordinateParser.parseCoordinates('OSGB36', coordinates, mockFromLonLat)

      expect(GeographicCoordinateConverter.osgb36ToWgs84).toHaveBeenCalledWith(
        577000,
        178000
      )
    })

    test('should call transformation function with converted coordinates', () => {
      const coordinates = setupOSGB36Test()

      coordinateParser.parseCoordinates('OSGB36', coordinates, mockFromLonLat)

      expect(mockFromLonLat).toHaveBeenCalledWith([0.7, 51.55])
    })

    test.each([
      {
        scenario: 'invalid coordinate system',
        coordinateSystem: 'INVALID',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      },
      {
        scenario: 'missing coordinates',
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5' }
      },
      {
        scenario: 'WGS84 system with OSGB36 format coordinates',
        coordinateSystem: 'WGS84',
        coordinates: { eastings: '530000', northings: '180000' }
      },
      {
        scenario: 'OSGB36 system with WGS84 format coordinates',
        coordinateSystem: 'OSGB36',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
    ])(
      'should return null for $scenario',
      ({ coordinateSystem, coordinates }) => {
        const result = coordinateParser.parseCoordinates(
          coordinateSystem,
          coordinates,
          mockFromLonLat
        )

        expect(result).toBeNull()
        expect(mockFromLonLat).not.toHaveBeenCalled()
        expect(
          GeographicCoordinateConverter.osgb36ToWgs84
        ).not.toHaveBeenCalled()
      }
    )
  })

  describe('convertFromLonLat', () => {
    test('should convert WGS84 coordinates to Web Mercator', () => {
      const coordinates = { longitude: '0.700000', latitude: '51.550000' }
      mockFromLonLat.mockReturnValue([56000, 6708000])

      const result = coordinateParser.convertFromLonLat(
        coordinates,
        mockFromLonLat
      )

      expect(result).toEqual([56000, 6708000])
      expect(mockFromLonLat).toHaveBeenCalledWith([0.7, 51.55])
    })
  })

  describe('convertOSGB36ToWebMercator', () => {
    test('should convert OSGB36 coordinates to Web Mercator', () => {
      setupOSGB36Test()

      const result = coordinateParser.convertOSGB36ToWebMercator(
        577000,
        178000,
        mockFromLonLat
      )

      expect(result).toEqual([56000, 6708000])
      expect(GeographicCoordinateConverter.osgb36ToWgs84).toHaveBeenCalledWith(
        577000,
        178000
      )
      expect(mockFromLonLat).toHaveBeenCalledWith([0.7, 51.55])
    })
  })

  describe('parseMultipleCoordinates', () => {
    test('should parse valid polygon coordinates array', () => {
      const coordinatesArray = [
        { latitude: '51.550000', longitude: '0.700000' },
        { latitude: '51.520000', longitude: '1.000000' },
        { latitude: '51.450000', longitude: '1.100000' }
      ]
      mockFromLonLat
        .mockReturnValueOnce([56000, 6708000])
        .mockReturnValueOnce([78000, 6698000])
        .mockReturnValueOnce([89000, 6680000])

      const result = coordinateParser.parseMultipleCoordinates(
        'WGS84',
        coordinatesArray,
        mockFromLonLat
      )

      expect(result).toEqual([
        [56000, 6708000],
        [78000, 6698000],
        [89000, 6680000]
      ])
      expect(mockFromLonLat).toHaveBeenCalledTimes(3)
    })

    test('should return null for insufficient coordinates (less than 3)', () => {
      const coordinatesArray = [
        { latitude: '51.550000', longitude: '0.700000' },
        { latitude: '51.520000', longitude: '1.000000' }
      ]

      const result = coordinateParser.parseMultipleCoordinates(
        'WGS84',
        coordinatesArray,
        mockFromLonLat
      )

      expect(result).toBeNull()
      expect(mockFromLonLat).not.toHaveBeenCalled()
    })

    test('should return null for null or undefined coordinates array', () => {
      expect(
        coordinateParser.parseMultipleCoordinates('WGS84', null, mockFromLonLat)
      ).toBeNull()
      expect(
        coordinateParser.parseMultipleCoordinates(
          'WGS84',
          undefined,
          mockFromLonLat
        )
      ).toBeNull()
      expect(mockFromLonLat).not.toHaveBeenCalled()
    })

    test('should return null when any coordinate in array fails to parse', () => {
      const coordinatesArray = [
        { latitude: '51.5', longitude: '-0.1' },
        { latitude: 'invalid', longitude: '-0.2' },
        { latitude: '51.7', longitude: '-0.3' }
      ]
      mockFromLonLat.mockReturnValue([1000, 2000])

      const originalParseCoordinates = coordinateParser.parseCoordinates
      coordinateParser.parseCoordinates = vi
        .fn()
        .mockReturnValueOnce([1000, 2000])
        .mockReturnValueOnce(null)
        .mockReturnValueOnce([1200, 2200])

      const result = coordinateParser.parseMultipleCoordinates(
        'WGS84',
        coordinatesArray,
        mockFromLonLat
      )

      expect(result).toBeNull()
      coordinateParser.parseCoordinates = originalParseCoordinates
    })

    test('should work with OSGB36 coordinates', () => {
      const coordinatesArray = [
        { eastings: '530000', northings: '180000' },
        { eastings: '531000', northings: '181000' },
        { eastings: '532000', northings: '182000' }
      ]

      GeographicCoordinateConverter.osgb36ToWgs84
        .mockReturnValueOnce([-0.1, 51.5])
        .mockReturnValueOnce([-0.2, 51.6])
        .mockReturnValueOnce([-0.3, 51.7])

      mockFromLonLat
        .mockReturnValueOnce([3000, 4000])
        .mockReturnValueOnce([3100, 4100])
        .mockReturnValueOnce([3200, 4200])

      const result = coordinateParser.parseMultipleCoordinates(
        'OSGB36',
        coordinatesArray,
        mockFromLonLat
      )

      expect(result).toEqual([
        [3000, 4000],
        [3100, 4100],
        [3200, 4200]
      ])
    })

    test('should handle empty array', () => {
      const result = coordinateParser.parseMultipleCoordinates(
        'WGS84',
        [],
        mockFromLonLat
      )

      expect(result).toBeNull()
      expect(mockFromLonLat).not.toHaveBeenCalled()
    })
  })
})
