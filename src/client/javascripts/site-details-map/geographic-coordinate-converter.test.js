import GeographicCoordinateConverter from './geographic-coordinate-converter.js'

describe('GeographicCoordinateConverter', () => {
  // Helper functions to reduce code duplication
  const expectBasicCoordinateResult = (result) => {
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
  }

  const expectValidCoordinateTypes = (result) => {
    expect(typeof result[0]).toBe('number')
    expect(typeof result[1]).toBe('number')
  }

  const expectFiniteCoordinates = (result) => {
    expect(isFinite(result[0])).toBe(true)
    expect(isFinite(result[1])).toBe(true)
  }

  const convertCoordinates = (easting, northing) =>
    GeographicCoordinateConverter.osgb36ToWgs84(easting, northing)

  const testBasicConversion = (easting, northing) => {
    const result = convertCoordinates(easting, northing)
    expectBasicCoordinateResult(result)
    expectValidCoordinateTypes(result)
    return result
  }

  describe('osgb36ToWgs84', () => {
    describe('valid coordinate conversions', () => {
      test.each([
        {
          location: 'London',
          easting: 530000,
          northing: 180000,
          expectedLon: 0.0,
          expectedLat: 51.5
        },
        {
          location: 'Edinburgh',
          easting: 325000,
          northing: 675000,
          expectedLon: -3.2,
          expectedLat: 55.9
        },
        {
          location: 'Brighton',
          easting: 532000,
          northing: 105000,
          expectedLon: 0.0,
          expectedLat: 50.8
        }
      ])(
        'should convert $location coordinates correctly',
        ({ easting, northing, expectedLon, expectedLat }) => {
          const result = testBasicConversion(easting, northing)
          expect(result[0]).toBeCloseTo(expectedLon, 0)
          expect(result[1]).toBeCloseTo(expectedLat, 0)
        }
      )
    })

    describe('boundary values', () => {
      // eslint-disable-next-line jest/expect-expect
      test.each([
        { description: 'minimum valid OSGB36', easting: 100000, northing: 0 },
        {
          description: 'maximum valid OSGB36',
          easting: 700000,
          northing: 1300000
        }
      ])('should handle $description coordinates', ({ easting, northing }) => {
        testBasicConversion(easting, northing)
      })
    })

    describe('precision requirements', () => {
      test.each([
        {
          description: 'sufficient precision for mapping',
          easting: 530000,
          northing: 180000,
          checks: (result) => {
            expect(result[0].toString()).toMatch(/^-?\d+\.\d{6,}$/)
            expect(result[1].toString()).toMatch(/^-?\d+\.\d{6,}$/)
          }
        },
        {
          description: 'consistent results for same input',
          easting: 400000,
          northing: 300000,
          checks: (result, easting, northing) => {
            const result2 = convertCoordinates(easting, northing)
            expect(result).toEqual(result2)
          }
        }
      ])(
        'should return coordinates with $description',
        ({ easting, northing, checks }) => {
          const result = convertCoordinates(easting, northing)
          checks(result, easting, northing)
        }
      )
    })

    describe('coordinate format validation', () => {
      test.each([
        {
          description: 'longitude first, latitude second',
          easting: 530000,
          northing: 180000,
          bounds: { lonMin: -180, lonMax: 180, latMin: -90, latMax: 90 }
        },
        {
          description: 'valid UK coordinates within expected bounds',
          easting: 400000,
          northing: 400000,
          bounds: { lonMin: -8, lonMax: 2, latMin: 49, latMax: 61 }
        }
      ])('should return $description', ({ easting, northing, bounds }) => {
        const result = convertCoordinates(easting, northing)
        const [longitude, latitude] = result

        expect(longitude).toBeGreaterThan(bounds.lonMin)
        expect(longitude).toBeLessThan(bounds.lonMax)
        expect(latitude).toBeGreaterThan(bounds.latMin)
        expect(latitude).toBeLessThan(bounds.latMax)
      })
    })

    describe('marine licensing coordinate examples', () => {
      test.each([
        {
          description: 'coastal coordinates accurately',
          easting: 450000,
          northing: 200000,
          expectedLon: -1.0,
          expectedLat: 51.7,
          additionalChecks: (result, expectedLon, expectedLat) => {
            expect(result[0]).toBeCloseTo(expectedLon, 0)
            expect(result[1]).toBeCloseTo(expectedLat, 0)
          }
        },
        {
          description: 'offshore coordinates accurately',
          easting: 500000,
          northing: 500000,
          additionalChecks: (result) => {
            expectFiniteCoordinates(result)
          }
        }
      ])(
        'should convert $description',
        ({ easting, northing, expectedLon, expectedLat, additionalChecks }) => {
          const result = testBasicConversion(easting, northing)
          additionalChecks(result, expectedLon, expectedLat)
        }
      )
    })

    describe('input handling', () => {
      // eslint-disable-next-line jest/expect-expect
      test.each([
        {
          description: 'integer coordinates',
          easting: 400000,
          northing: 300000
        },
        {
          description: 'floating point coordinates',
          easting: 400000.5,
          northing: 300000.7
        },
        {
          description: 'negative coordinates',
          easting: -100000,
          northing: -50000
        }
      ])('should handle $description', ({ easting, northing }) => {
        const result = convertCoordinates(easting, northing)
        expectBasicCoordinateResult(result)
      })
    })
  })
})
