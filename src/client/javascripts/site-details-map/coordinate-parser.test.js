import CoordinateParser from './coordinate-parser.js'
import GeographicCoordinateConverter from './geographic-coordinate-converter.js'

jest.mock('./geographic-coordinate-converter.js', () => ({
  default: {
    osgb36ToWgs84: jest.fn()
  }
}))

describe('CoordinateParser', () => {
  let coordinateParser
  let mockFromLonLat

  beforeEach(() => {
    jest.clearAllMocks()
    GeographicCoordinateConverter.osgb36ToWgs84 = jest.fn()
    coordinateParser = new CoordinateParser()
    mockFromLonLat = jest.fn()
  })

  const setupOSGB36Test = (webMercatorResult = [3000, 4000]) => {
    const coordinates = { eastings: '530000', northings: '180000' }
    GeographicCoordinateConverter.osgb36ToWgs84.mockReturnValue([-0.1, 51.5])
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

      expect(result).toEqual([3000, 4000])
    })

    test('should convert OSGB36 to WGS84 before transformation', () => {
      const coordinates = setupOSGB36Test()

      coordinateParser.parseCoordinates('OSGB36', coordinates, mockFromLonLat)

      expect(GeographicCoordinateConverter.osgb36ToWgs84).toHaveBeenCalledWith(
        530000,
        180000
      )
    })

    test('should call transformation function with converted coordinates', () => {
      const coordinates = setupOSGB36Test()

      coordinateParser.parseCoordinates('OSGB36', coordinates, mockFromLonLat)

      expect(mockFromLonLat).toHaveBeenCalledWith([-0.1, 51.5])
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
      const coordinates = { longitude: '-0.1', latitude: '51.5' }
      mockFromLonLat.mockReturnValue([1000, 2000])

      const result = coordinateParser.convertFromLonLat(
        coordinates,
        mockFromLonLat
      )

      expect(result).toEqual([1000, 2000])
      expect(mockFromLonLat).toHaveBeenCalledWith([-0.1, 51.5])
    })
  })

  describe('convertOSGB36ToWebMercator', () => {
    test('should convert OSGB36 coordinates to Web Mercator', () => {
      setupOSGB36Test()

      const result = coordinateParser.convertOSGB36ToWebMercator(
        530000,
        180000,
        mockFromLonLat
      )

      expect(result).toEqual([3000, 4000])
      expect(GeographicCoordinateConverter.osgb36ToWgs84).toHaveBeenCalledWith(
        530000,
        180000
      )
      expect(mockFromLonLat).toHaveBeenCalledWith([-0.1, 51.5])
    })
  })
})
