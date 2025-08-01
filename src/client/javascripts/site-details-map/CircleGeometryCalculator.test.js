import CircleGeometryCalculator from './CircleGeometryCalculator.js'

describe('CircleGeometryCalculator', () => {
  // Helper functions to reduce code duplication
  const expectValidCoordinateFormat = (coordinates) => {
    coordinates.forEach((coordinate) => {
      expect(typeof coordinate[0]).toBe('number')
      expect(typeof coordinate[1]).toBe('number')
      expect(isFinite(coordinate[0])).toBe(true)
      expect(isFinite(coordinate[1])).toBe(true)
    })
  }

  const expectBasicArrayResult = (result, expectedLength = 2) => {
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(expectedLength)
  }

  const expectBasicCircleResult = (result, expectedLength = 65) => {
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(expectedLength)
  }

  const defaultTestCoords = () => ({
    centerLon: 0,
    centerLat: 51.5,
    centerLonLat: [0, 51.5]
  })
  const defaultCircleParams = () => ({
    ...defaultTestCoords(),
    radiusInMeters: 1000
  })
  const defaultPointParams = () => ({
    ...defaultTestCoords(),
    angularDistance: 0.001,
    bearing: Math.PI / 4
  })

  // Test execution helpers
  const createCircle = (centerLonLat, radiusInMeters, sides) =>
    CircleGeometryCalculator.createGeographicCircle(
      centerLonLat,
      radiusInMeters,
      sides
    )

  const calculatePoint = (centerLon, centerLat, angularDistance, bearing) =>
    CircleGeometryCalculator.calculateCirclePoint(
      centerLon,
      centerLat,
      angularDistance,
      bearing
    )

  // Combined test helpers
  const testBasicCircle = (params, expectedLength = 65) => {
    const result = createCircle(
      params.centerLonLat,
      params.radiusInMeters,
      params.sides
    )
    expectBasicCircleResult(result, expectedLength)
    return result
  }

  const testBasicPoint = (params) => {
    const result = calculatePoint(
      params.centerLon,
      params.centerLat,
      params.angularDistance,
      params.bearing
    )
    expectBasicArrayResult(result)
    return result
  }

  describe('createGeographicCircle', () => {
    describe('basic circle creation', () => {
      // eslint-disable-next-line jest/expect-expect
      test.each([
        {
          sides: undefined,
          expectedLength: 65,
          description: 'default 64 sides'
        },
        {
          sides: 32,
          expectedLength: 33,
          description: 'custom number of sides'
        },
        { sides: 3, expectedLength: 4, description: 'minimum sides' }
      ])(
        'should create circle with $description',
        ({ sides, expectedLength }) => {
          const params = { ...defaultCircleParams(), sides }
          testBasicCircle(params, expectedLength)
        }
      )
    })

    describe('coordinate format validation', () => {
      test('should return coordinates as longitude latitude pairs', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        result.forEach((coordinate) => {
          expect(Array.isArray(coordinate)).toBe(true)
          expect(coordinate).toHaveLength(2)
        })
        expectValidCoordinateFormat(result)
      })

      test('should ensure all coordinates are within valid geographic bounds', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        result.forEach((coordinate) => {
          const [lon, lat] = coordinate
          expect(lon).toBeGreaterThan(-180)
          expect(lon).toBeLessThan(180)
          expect(lat).toBeGreaterThan(-90)
          expect(lat).toBeLessThan(90)
        })
      })
    })

    describe('circle closure validation', () => {
      test('should create closed circle where first point equals last point', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        const firstPoint = result[0]
        const lastPoint = result[result.length - 1]

        expect(firstPoint[0]).toBeCloseTo(lastPoint[0], 10)
        expect(firstPoint[1]).toBeCloseTo(lastPoint[1], 10)
      })
    })

    describe('different radii', () => {
      test.each([
        {
          description: 'small circle for short radius',
          radiusInMeters: 100,
          expectDistance: (distance) => expect(distance).toBeLessThan(0.01)
        },
        {
          description: 'large circle for long radius',
          radiusInMeters: 10000,
          expectDistance: (distance) => expect(distance).toBeGreaterThan(0.01)
        }
      ])('should create $description', ({ radiusInMeters, expectDistance }) => {
        const centerLonLat = [0, 51.5]
        const result = createCircle(centerLonLat, radiusInMeters)
        expectBasicCircleResult(result)

        const [centerLon, centerLat] = centerLonLat
        result.forEach((coordinate) => {
          const [lon, lat] = coordinate
          const distance = Math.sqrt(
            Math.pow(lon - centerLon, 2) + Math.pow(lat - centerLat, 2)
          )
          expectDistance(distance)
        })
      })

      test('should handle zero radius', () => {
        const centerLonLat = [0, 51.5]
        const result = createCircle(centerLonLat, 0)
        expectBasicCircleResult(result)

        result.forEach((coordinate) => {
          expect(coordinate[0]).toBeCloseTo(centerLonLat[0], 10)
          expect(coordinate[1]).toBeCloseTo(centerLonLat[1], 10)
        })
      })
    })

    describe('different center locations', () => {
      test.each([
        { location: 'London', centerLonLat: [-0.1276, 51.5074] },
        { location: 'Edinburgh', centerLonLat: [-3.1883, 55.9533] }
      ])(
        'should create circle around $location coordinates',
        ({ centerLonLat }) => {
          const result = createCircle(centerLonLat, 1000)
          expectBasicCircleResult(result)

          result.forEach((coordinate) => {
            expect(coordinate[0]).toBeCloseTo(centerLonLat[0], 1)
            expect(coordinate[1]).toBeCloseTo(centerLonLat[1], 1)
          })
        }
      )
    })

    describe('marine licensing scenarios', () => {
      test('should create appropriate circle for marine site boundary', () => {
        const centerLonLat = [1.0, 52.0]
        const radiusInMeters = 500

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        expect(result).toBeDefined()
        expect(result).toHaveLength(65)

        expectValidCoordinateFormat(result)
      })
    })

    describe('mathematical precision validation', () => {
      test('should generate correct bearing angles for known side counts', () => {
        const centerLonLat = [0, 0]
        const radiusInMeters = 1000

        // Test 4-sided polygon (square) - bearings should be 0, π/2, π, 3π/2
        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters,
          4
        )

        expect(result).toHaveLength(5) // 4 sides + 1 closure point

        // First point (bearing 0) should be due north of center
        expect(result[0][0]).toBeCloseTo(0, 10) // longitude unchanged
        expect(result[0][1]).toBeGreaterThan(0) // latitude increased (north)

        // Second point (bearing π/2) should be due east of center
        expect(result[1][0]).toBeGreaterThan(0) // longitude increased (east)
        expect(result[1][1]).toBeCloseTo(0, 5) // latitude approximately center

        // Third point (bearing π) should be due south of center
        expect(result[2][0]).toBeCloseTo(0, 10) // longitude unchanged
        expect(result[2][1]).toBeLessThan(0) // latitude decreased (south)

        // Fourth point (bearing 3π/2) should be due west of center
        expect(result[3][0]).toBeLessThan(0) // longitude decreased (west)
        expect(result[3][1]).toBeCloseTo(0, 5) // latitude approximately center
      })

      test('should calculate correct distances from center for all points', () => {
        const centerLonLat = [0, 51.5] // London-ish
        const radiusInMeters = 1000
        const earthRadiusKm = 6378.137

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters,
          8
        )

        // Calculate expected angular distance in degrees
        const expectedAngularDistanceDeg =
          (radiusInMeters / 1000 / earthRadiusKm) * (180 / Math.PI)

        result.slice(0, -1).forEach((point) => {
          const [lon, lat] = point
          const [centerLon, centerLat] = centerLonLat

          // Calculate distance using spherical law of cosines
          const latRad1 = (centerLat * Math.PI) / 180
          const latRad2 = (lat * Math.PI) / 180
          const deltaLonRad = ((lon - centerLon) * Math.PI) / 180

          const angularDistance = Math.acos(
            Math.sin(latRad1) * Math.sin(latRad2) +
              Math.cos(latRad1) * Math.cos(latRad2) * Math.cos(deltaLonRad)
          )

          const distanceDeg = (angularDistance * 180) / Math.PI

          // Should be within 1% of expected distance
          expect(distanceDeg).toBeCloseTo(expectedAngularDistanceDeg, 4)
        })
      })

      test('should validate spherical trigonometry formulas with known coordinates', () => {
        const centerLon = 0
        const centerLat = 0 // Equator for simpler math
        const angularDistance = 0.001 // Small distance for precision
        const bearing = Math.PI / 2 // Due east

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        // At equator, due east movement should only affect longitude
        expect(result[1]).toBeCloseTo(0, 8) // latitude should remain ~0
        expect(result[0]).toBeGreaterThan(0) // longitude should increase

        // Test due north (bearing = 0)
        const northResult = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          0
        )

        expect(northResult[0]).toBeCloseTo(0, 8) // longitude should remain ~0
        expect(northResult[1]).toBeGreaterThan(0) // latitude should increase
      })

      test('should produce symmetric results for opposite bearings', () => {
        const centerLon = 1
        const centerLat = 52
        const angularDistance = 0.01

        // Test north vs south
        const north = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          0
        )
        const south = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          Math.PI
        )

        // Should be equidistant from center but in opposite directions
        expect(north[0]).toBeCloseTo(south[0], 6) // same longitude
        expect(Math.abs(north[1] - centerLat)).toBeCloseTo(
          Math.abs(south[1] - centerLat),
          6
        )
        expect((north[1] - centerLat) * (south[1] - centerLat)).toBeLessThan(0) // opposite sides

        // Test east vs west
        const east = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          Math.PI / 2
        )
        const west = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          (3 * Math.PI) / 2
        )

        expect(east[1]).toBeCloseTo(west[1], 6) // same latitude
        expect(Math.abs(east[0] - centerLon)).toBeCloseTo(
          Math.abs(west[0] - centerLon),
          6
        )
        expect((east[0] - centerLon) * (west[0] - centerLon)).toBeLessThan(0) // opposite sides
      })
    })
  })

  describe('calculateCirclePoint', () => {
    describe('cardinal bearings', () => {
      test.each([
        {
          direction: 'north',
          bearing: 0,
          expectLon: (result, centerLon) =>
            expect(result[0]).toBeCloseTo(centerLon, 3),
          expectLat: (result, centerLat) =>
            expect(result[1]).toBeGreaterThan(centerLat)
        },
        {
          direction: 'east',
          bearing: Math.PI / 2,
          expectLon: (result, centerLon) =>
            expect(result[0]).toBeGreaterThan(centerLon),
          expectLat: (result, centerLat) =>
            expect(result[1]).toBeCloseTo(centerLat, 3)
        },
        {
          direction: 'south',
          bearing: Math.PI,
          expectLon: (result, centerLon) =>
            expect(result[0]).toBeCloseTo(centerLon, 3),
          expectLat: (result, centerLat) =>
            expect(result[1]).toBeLessThan(centerLat)
        },
        {
          direction: 'west',
          bearing: (3 * Math.PI) / 2,
          expectLon: (result, centerLon) =>
            expect(result[0]).toBeLessThan(centerLon),
          expectLat: (result, centerLat) =>
            expect(result[1]).toBeCloseTo(centerLat, 3)
        }
      ])(
        'should calculate $direction point correctly',
        ({ bearing, expectLon, expectLat }) => {
          const params = { ...defaultPointParams(), bearing }
          const result = testBasicPoint(params)
          expectLon(result, params.centerLon)
          expectLat(result, params.centerLat)
        }
      )
    })

    describe('angular distance variations', () => {
      test.each([
        {
          description: 'zero angular distance',
          angularDistance: 0,
          bearing: 0,
          additionalChecks: (result, params) => {
            expect(result[0]).toBeCloseTo(params.centerLon, 10)
            expect(result[1]).toBeCloseTo(params.centerLat, 10)
          }
        },
        {
          description: 'small angular distance',
          angularDistance: 0.0001,
          bearing: Math.PI / 4
        },
        {
          description: 'large angular distance',
          angularDistance: 0.1,
          bearing: Math.PI / 4
        }
      ])(
        'should handle $description',
        ({ angularDistance, bearing, additionalChecks }) => {
          const params = { ...defaultTestCoords(), angularDistance, bearing }
          const result = testBasicPoint(params)
          if (additionalChecks) {
            additionalChecks(result, params)
          }
        }
      )
    })

    describe('coordinate format validation', () => {
      test.each([
        {
          description: 'valid geographic coordinates',
          checks: (result) => {
            expect(result[0]).toBeGreaterThan(-180)
            expect(result[0]).toBeLessThan(180)
            expect(result[1]).toBeGreaterThan(-90)
            expect(result[1]).toBeLessThan(90)
          }
        },
        {
          description: 'finite numbers',
          checks: (result) => {
            expect(isFinite(result[0])).toBe(true)
            expect(isFinite(result[1])).toBe(true)
            expect(isNaN(result[0])).toBe(false)
            expect(isNaN(result[1])).toBe(false)
          }
        }
      ])('should return $description', ({ checks }) => {
        const result = testBasicPoint(defaultPointParams())
        checks(result)
      })
    })

    describe('mathematical precision', () => {
      test.each([
        {
          description: 'consistent results for same inputs',
          checks: (params) => {
            const result1 = calculatePoint(
              params.centerLon,
              params.centerLat,
              params.angularDistance,
              params.bearing
            )
            const result2 = calculatePoint(
              params.centerLon,
              params.centerLat,
              params.angularDistance,
              params.bearing
            )
            expect(result1).toEqual(result2)
          }
        },
        {
          description: 'sufficient precision for mapping applications',
          checks: (params) => {
            const result = calculatePoint(
              params.centerLon,
              params.centerLat,
              params.angularDistance,
              params.bearing
            )
            expect(result[0].toString()).toMatch(/^-?\d+\.\d{6,}$/)
            expect(result[1].toString()).toMatch(/^-?\d+\.\d{6,}$/)
          }
        }
      ])('should produce $description', ({ checks }) => {
        const params = defaultPointParams()
        checks(params)
      })
    })
  })
})
