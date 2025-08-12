import CircleGeometryCalculator from './circle-geometry-calculator.js'

describe('CircleGeometryCalculator', () => {
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
          expect.hasAssertions()
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

      const calculateSquareCircle = () => {
        const setup = createSquareTestSetup()
        return CircleGeometryCalculator.createGeographicCircle(
          setup.centreLonLat,
          setup.radiusInMetres,
          setup.sides
        )
      }

      test('should generate correct number of points for square', () => {
        const result = calculateSquareCircle()
        expect(result).toHaveLength(5)
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
        const result = calculateSquareCircle()
        expectLon(result[index][0])
        expectLat(result[index][1])
      })

      test('should calculate correct distances from centre for all points', () => {
        const centreLonLat = [0, 51.5]
        const radiusInMetres = 1000
        const earthRadiusKm = 6378.137

        const result = CircleGeometryCalculator.createGeographicCircle(
          centreLonLat,
          radiusInMetres,
          8
        )

        const expectedAngularDistanceDeg =
          (radiusInMetres / 1000 / earthRadiusKm) * (180 / Math.PI)

        result.slice(0, -1).forEach((point) => {
          const [lon, lat] = point
          const [centreLon, centreLat] = centreLonLat

          const latRad1 = (centreLat * Math.PI) / 180
          const latRad2 = (lat * Math.PI) / 180
          const deltaLonRad = ((lon - centreLon) * Math.PI) / 180

          const angularDistance = Math.acos(
            Math.sin(latRad1) * Math.sin(latRad2) +
              Math.cos(latRad1) * Math.cos(latRad2) * Math.cos(deltaLonRad)
          )

          const distanceDeg = (angularDistance * 180) / Math.PI

          expect(distanceDeg).toBeCloseTo(expectedAngularDistanceDeg, 4)
        })
      })

      const getSymmetryTestSetup = () => ({
        centreLon: 1,
        centreLat: 52,
        angularDistance: 0.01
      })

      const calculateOppositePoints = (setup, bearing1, bearing2) => {
        const point1 = CircleGeometryCalculator.calculateCirclePoint(
          setup.centreLon,
          setup.centreLat,
          setup.angularDistance,
          bearing1
        )
        const point2 = CircleGeometryCalculator.calculateCirclePoint(
          setup.centreLon,
          setup.centreLat,
          setup.angularDistance,
          bearing2
        )
        return { point1, point2 }
      }

      test.each([
        {
          description: 'north vs south bearings',
          bearing1: 0,
          bearing2: Math.PI,
          checkCoordinate: 0,
          variableCoordinate: 1,
          centreValue: (setup) => setup.centreLat
        },
        {
          description: 'east vs west bearings',
          bearing1: Math.PI / 2,
          bearing2: (3 * Math.PI) / 2,
          checkCoordinate: 1,
          variableCoordinate: 0,
          centreValue: (setup) => setup.centreLon
        }
      ])(
        'should produce symmetric results for $description',
        ({
          bearing1,
          bearing2,
          checkCoordinate,
          variableCoordinate,
          centreValue
        }) => {
          const setup = getSymmetryTestSetup()
          const { point1, point2 } = calculateOppositePoints(
            setup,
            bearing1,
            bearing2
          )
          const centre = centreValue(setup)

          expect(point1[checkCoordinate]).toBeCloseTo(
            point2[checkCoordinate],
            6
          )
          expect(Math.abs(point1[variableCoordinate] - centre)).toBeCloseTo(
            Math.abs(point2[variableCoordinate] - centre),
            6
          )
          expect(
            (point1[variableCoordinate] - centre) *
              (point2[variableCoordinate] - centre)
          ).toBeLessThan(0)
        }
      )
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
