import CircleGeometryCalculator from './circle-geometry-calculator.js'

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
    centreLon: 0,
    centreLat: 51.5,
    centreLonLat: [0, 51.5]
  })
  const defaultCircleParams = () => ({
    ...defaultTestCoords(),
    radiusInMetres: 1000
  })
  const defaultPointParams = () => ({
    ...defaultTestCoords(),
    angularDistance: 0.001,
    bearing: Math.PI / 4
  })

  // Test execution helpers
  const createCircle = (centreLonLat, radiusInMetres, sides) =>
    CircleGeometryCalculator.createGeographicCircle(
      centreLonLat,
      radiusInMetres,
      sides
    )

  const calculatePoint = (centreLon, centreLat, angularDistance, bearing) =>
    CircleGeometryCalculator.calculateCirclePoint(
      centreLon,
      centreLat,
      angularDistance,
      bearing
    )

  // Combined test helpers
  const testBasicCircle = (params, expectedLength = 65) => {
    const result = createCircle(
      params.centreLonLat,
      params.radiusInMetres,
      params.sides
    )
    expectBasicCircleResult(result, expectedLength)
    return result
  }

  const testBasicPoint = (params) => {
    const result = calculatePoint(
      params.centreLon,
      params.centreLat,
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
        const centreLonLat = [0, 51.5]
        const radiusInMetres = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centreLonLat,
          radiusInMetres
        )

        result.forEach((coordinate) => {
          expect(Array.isArray(coordinate)).toBe(true)
          expect(coordinate).toHaveLength(2)
        })
        expectValidCoordinateFormat(result)
      })

      test('should ensure all coordinates are within valid geographic bounds', () => {
        const centreLonLat = [0, 51.5]
        const radiusInMetres = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centreLonLat,
          radiusInMetres
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
        const centreLonLat = [0, 51.5]
        const radiusInMetres = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centreLonLat,
          radiusInMetres
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
          radiusInMetres: 100,
          expectDistance: (distance) => expect(distance).toBeLessThan(0.01)
        },
        {
          description: 'large circle for long radius',
          radiusInMetres: 10000,
          expectDistance: (distance) => expect(distance).toBeGreaterThan(0.01)
        }
      ])('should create $description', ({ radiusInMetres, expectDistance }) => {
        const centreLonLat = [0, 51.5]
        const result = createCircle(centreLonLat, radiusInMetres)
        expectBasicCircleResult(result)

        const [centreLon, centreLat] = centreLonLat
        result.forEach((coordinate) => {
          const [lon, lat] = coordinate
          const distance = Math.sqrt(
            Math.pow(lon - centreLon, 2) + Math.pow(lat - centreLat, 2)
          )
          expectDistance(distance)
        })
      })

      test('should handle zero radius', () => {
        const centreLonLat = [0, 51.5]
        const result = createCircle(centreLonLat, 0)
        expectBasicCircleResult(result)

        result.forEach((coordinate) => {
          expect(coordinate[0]).toBeCloseTo(centreLonLat[0], 10)
          expect(coordinate[1]).toBeCloseTo(centreLonLat[1], 10)
        })
      })
    })

    describe('different centre locations', () => {
      test.each([
        { location: 'London', centreLonLat: [-0.1276, 51.5074] },
        { location: 'Edinburgh', centreLonLat: [-3.1883, 55.9533] }
      ])(
        'should create circle around $location coordinates',
        ({ centreLonLat }) => {
          const result = createCircle(centreLonLat, 1000)
          expectBasicCircleResult(result)

          result.forEach((coordinate) => {
            expect(coordinate[0]).toBeCloseTo(centreLonLat[0], 1)
            expect(coordinate[1]).toBeCloseTo(centreLonLat[1], 1)
          })
        }
      )
    })

    describe('marine licensing scenarios', () => {
      test('should create appropriate circle for marine site boundary', () => {
        const centreLonLat = [1.0, 52.0]
        const radiusInMetres = 500

        const result = CircleGeometryCalculator.createGeographicCircle(
          centreLonLat,
          radiusInMetres
        )

        expect(result).toBeDefined()
        expect(result).toHaveLength(65)

        expectValidCoordinateFormat(result)
      })
    })

    describe('mathematical precision validation', () => {
      const createSquareTestSetup = () => ({
        centreLonLat: [0, 0],
        radiusInMetres: 1000,
        sides: 4
      })

      test('should generate correct number of points for square', () => {
        const setup = createSquareTestSetup()
        const result = CircleGeometryCalculator.createGeographicCircle(
          setup.centreLonLat,
          setup.radiusInMetres,
          setup.sides
        )

        expect(result).toHaveLength(5) // 4 sides + 1 closure point
      })

      test.each([
        {
          description: 'first point due north of centre',
          index: 0,
          expectLon: (lon) => expect(lon).toBeCloseTo(0, 10),
          expectLat: (lat) => expect(lat).toBeGreaterThan(0)
        },
        {
          description: 'second point due east of centre',
          index: 1,
          expectLon: (lon) => expect(lon).toBeGreaterThan(0),
          expectLat: (lat) => expect(lat).toBeCloseTo(0, 5)
        },
        {
          description: 'third point due south of centre',
          index: 2,
          expectLon: (lon) => expect(lon).toBeCloseTo(0, 10),
          expectLat: (lat) => expect(lat).toBeLessThan(0)
        },
        {
          description: 'fourth point due west of centre',
          index: 3,
          expectLon: (lon) => expect(lon).toBeLessThan(0),
          expectLat: (lat) => expect(lat).toBeCloseTo(0, 5)
        }
      ])('should place $description', ({ index, expectLon, expectLat }) => {
        const setup = createSquareTestSetup()
        const result = CircleGeometryCalculator.createGeographicCircle(
          setup.centreLonLat,
          setup.radiusInMetres,
          setup.sides
        )

        expectLon(result[index][0])
        expectLat(result[index][1])
      })

      test('should calculate correct distances from centre for all points', () => {
        const centreLonLat = [0, 51.5] // London-ish
        const radiusInMetres = 1000
        const earthRadiusKm = 6378.137

        const result = CircleGeometryCalculator.createGeographicCircle(
          centreLonLat,
          radiusInMetres,
          8
        )

        // Calculate expected angular distance in degrees
        const expectedAngularDistanceDeg =
          (radiusInMetres / 1000 / earthRadiusKm) * (180 / Math.PI)

        result.slice(0, -1).forEach((point) => {
          const [lon, lat] = point
          const [centreLon, centreLat] = centreLonLat

          // Calculate distance using spherical law of cosines
          const latRad1 = (centreLat * Math.PI) / 180
          const latRad2 = (lat * Math.PI) / 180
          const deltaLonRad = ((lon - centreLon) * Math.PI) / 180

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
        const centreLon = 0
        const centreLat = 0 // Equator for simpler math
        const angularDistance = 0.001 // Small distance for precision
        const bearing = Math.PI / 2 // Due east

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centreLon,
          centreLat,
          angularDistance,
          bearing
        )

        // At equator, due east movement should only affect longitude
        expect(result[1]).toBeCloseTo(0, 8) // latitude should remain ~0
        expect(result[0]).toBeGreaterThan(0) // longitude should increase

        // Test due north (bearing = 0)
        const northResult = CircleGeometryCalculator.calculateCirclePoint(
          centreLon,
          centreLat,
          angularDistance,
          0
        )

        expect(northResult[0]).toBeCloseTo(0, 8) // longitude should remain ~0
        expect(northResult[1]).toBeGreaterThan(0) // latitude should increase
      })

      test('should produce symmetric results for north vs south bearings', () => {
        const centreLon = 1
        const centreLat = 52
        const angularDistance = 0.01

        const north = CircleGeometryCalculator.calculateCirclePoint(
          centreLon,
          centreLat,
          angularDistance,
          0
        )
        const south = CircleGeometryCalculator.calculateCirclePoint(
          centreLon,
          centreLat,
          angularDistance,
          Math.PI
        )

        expect(north[0]).toBeCloseTo(south[0], 6) // same longitude
        expect(Math.abs(north[1] - centreLat)).toBeCloseTo(
          Math.abs(south[1] - centreLat),
          6
        )
        expect((north[1] - centreLat) * (south[1] - centreLat)).toBeLessThan(0) // opposite sides
      })

      test('should produce symmetric results for east vs west bearings', () => {
        const centreLon = 1
        const centreLat = 52
        const angularDistance = 0.01

        const east = CircleGeometryCalculator.calculateCirclePoint(
          centreLon,
          centreLat,
          angularDistance,
          Math.PI / 2
        )
        const west = CircleGeometryCalculator.calculateCirclePoint(
          centreLon,
          centreLat,
          angularDistance,
          (3 * Math.PI) / 2
        )

        expect(east[1]).toBeCloseTo(west[1], 6) // same latitude
        expect(Math.abs(east[0] - centreLon)).toBeCloseTo(
          Math.abs(west[0] - centreLon),
          6
        )
        expect((east[0] - centreLon) * (west[0] - centreLon)).toBeLessThan(0) // opposite sides
      })
    })
  })

  describe('calculateCirclePoint', () => {
    describe('cardinal bearings', () => {
      test.each([
        {
          direction: 'north',
          bearing: 0,
          expectLon: (result, centreLon) =>
            expect(result[0]).toBeCloseTo(centreLon, 3),
          expectLat: (result, centreLat) =>
            expect(result[1]).toBeGreaterThan(centreLat)
        },
        {
          direction: 'east',
          bearing: Math.PI / 2,
          expectLon: (result, centreLon) =>
            expect(result[0]).toBeGreaterThan(centreLon),
          expectLat: (result, centreLat) =>
            expect(result[1]).toBeCloseTo(centreLat, 3)
        },
        {
          direction: 'south',
          bearing: Math.PI,
          expectLon: (result, centreLon) =>
            expect(result[0]).toBeCloseTo(centreLon, 3),
          expectLat: (result, centreLat) =>
            expect(result[1]).toBeLessThan(centreLat)
        },
        {
          direction: 'west',
          bearing: (3 * Math.PI) / 2,
          expectLon: (result, centreLon) =>
            expect(result[0]).toBeLessThan(centreLon),
          expectLat: (result, centreLat) =>
            expect(result[1]).toBeCloseTo(centreLat, 3)
        }
      ])(
        'should calculate $direction point correctly',
        ({ bearing, expectLon, expectLat }) => {
          const params = { ...defaultPointParams(), bearing }
          const result = testBasicPoint(params)
          expectLon(result, params.centreLon)
          expectLat(result, params.centreLat)
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
            expect(result[0]).toBeCloseTo(params.centreLon, 10)
            expect(result[1]).toBeCloseTo(params.centreLat, 10)
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
              params.centreLon,
              params.centreLat,
              params.angularDistance,
              params.bearing
            )
            const result2 = calculatePoint(
              params.centreLon,
              params.centreLat,
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
              params.centreLon,
              params.centreLat,
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
