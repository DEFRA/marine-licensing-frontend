import CircleGeometryCalculator from './CircleGeometryCalculator.js'

describe('CircleGeometryCalculator', () => {
  describe('createGeographicCircle', () => {
    describe('basic circle creation', () => {
      test('should create circle with default 64 sides', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(65)
      })

      test('should create circle with custom number of sides', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 1000
        const sides = 32

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters,
          sides
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(33)
      })

      test('should create circle with minimum sides', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 1000
        const sides = 3

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters,
          sides
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(4)
      })
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
          expect(typeof coordinate[0]).toBe('number')
          expect(typeof coordinate[1]).toBe('number')
        })
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
      test('should create small circle for short radius', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 100

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        expect(result).toBeDefined()
        expect(result).toHaveLength(65)

        const [centerLon, centerLat] = centerLonLat
        result.forEach((coordinate) => {
          const [lon, lat] = coordinate
          const distance = Math.sqrt(
            Math.pow(lon - centerLon, 2) + Math.pow(lat - centerLat, 2)
          )
          expect(distance).toBeLessThan(0.01)
        })
      })

      test('should create large circle for long radius', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 10000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        expect(result).toBeDefined()
        expect(result).toHaveLength(65)

        const [centerLon, centerLat] = centerLonLat
        result.forEach((coordinate) => {
          const [lon, lat] = coordinate
          const distance = Math.sqrt(
            Math.pow(lon - centerLon, 2) + Math.pow(lat - centerLat, 2)
          )
          expect(distance).toBeGreaterThan(0.01)
        })
      })

      test('should handle zero radius', () => {
        const centerLonLat = [0, 51.5]
        const radiusInMeters = 0

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        expect(result).toBeDefined()
        expect(result).toHaveLength(65)

        result.forEach((coordinate) => {
          expect(coordinate[0]).toBeCloseTo(centerLonLat[0], 10)
          expect(coordinate[1]).toBeCloseTo(centerLonLat[1], 10)
        })
      })
    })

    describe('different center locations', () => {
      test('should create circle around London coordinates', () => {
        const centerLonLat = [-0.1276, 51.5074]
        const radiusInMeters = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        expect(result).toBeDefined()
        expect(result).toHaveLength(65)

        result.forEach((coordinate) => {
          expect(coordinate[0]).toBeCloseTo(-0.1276, 1)
          expect(coordinate[1]).toBeCloseTo(51.5074, 1)
        })
      })

      test('should create circle around Edinburgh coordinates', () => {
        const centerLonLat = [-3.1883, 55.9533]
        const radiusInMeters = 1000

        const result = CircleGeometryCalculator.createGeographicCircle(
          centerLonLat,
          radiusInMeters
        )

        expect(result).toBeDefined()
        expect(result).toHaveLength(65)

        result.forEach((coordinate) => {
          expect(coordinate[0]).toBeCloseTo(-3.1883, 1)
          expect(coordinate[1]).toBeCloseTo(55.9533, 1)
        })
      })
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

        result.forEach((coordinate) => {
          expect(typeof coordinate[0]).toBe('number')
          expect(typeof coordinate[1]).toBe('number')
          expect(isFinite(coordinate[0])).toBe(true)
          expect(isFinite(coordinate[1])).toBe(true)
        })
      })
    })
  })

  describe('calculateCirclePoint', () => {
    describe('cardinal bearings', () => {
      test('should calculate north point correctly', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.001
        const bearing = 0

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(result[0]).toBeCloseTo(centerLon, 3)
        expect(result[1]).toBeGreaterThan(centerLat)
      })

      test('should calculate east point correctly', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.001
        const bearing = Math.PI / 2

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(result[0]).toBeGreaterThan(centerLon)
        expect(result[1]).toBeCloseTo(centerLat, 3)
      })

      test('should calculate south point correctly', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.001
        const bearing = Math.PI

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(result[0]).toBeCloseTo(centerLon, 3)
        expect(result[1]).toBeLessThan(centerLat)
      })

      test('should calculate west point correctly', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.001
        const bearing = (3 * Math.PI) / 2

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(result[0]).toBeLessThan(centerLon)
        expect(result[1]).toBeCloseTo(centerLat, 3)
      })
    })

    describe('angular distance variations', () => {
      test('should handle zero angular distance', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0
        const bearing = 0

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result).toBeDefined()
        expect(result[0]).toBeCloseTo(centerLon, 10)
        expect(result[1]).toBeCloseTo(centerLat, 10)
      })

      test('should handle small angular distance', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.0001
        const bearing = Math.PI / 4

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(typeof result[0]).toBe('number')
        expect(typeof result[1]).toBe('number')
      })

      test('should handle large angular distance', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.1
        const bearing = Math.PI / 4

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(typeof result[0]).toBe('number')
        expect(typeof result[1]).toBe('number')
      })
    })

    describe('coordinate format validation', () => {
      test('should return valid geographic coordinates', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.001
        const bearing = Math.PI / 4

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result[0]).toBeGreaterThan(-180)
        expect(result[0]).toBeLessThan(180)
        expect(result[1]).toBeGreaterThan(-90)
        expect(result[1]).toBeLessThan(90)
      })

      test('should return finite numbers', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.001
        const bearing = Math.PI / 4

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(isFinite(result[0])).toBe(true)
        expect(isFinite(result[1])).toBe(true)
        expect(isNaN(result[0])).toBe(false)
        expect(isNaN(result[1])).toBe(false)
      })
    })

    describe('mathematical precision', () => {
      test('should produce consistent results for same inputs', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.001
        const bearing = Math.PI / 4

        const result1 = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )
        const result2 = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result1).toEqual(result2)
      })

      test('should maintain sufficient precision for mapping applications', () => {
        const centerLon = 0
        const centerLat = 51.5
        const angularDistance = 0.001
        const bearing = Math.PI / 4

        const result = CircleGeometryCalculator.calculateCirclePoint(
          centerLon,
          centerLat,
          angularDistance,
          bearing
        )

        expect(result[0].toString()).toMatch(/^-?\d+\.\d{6,}$/)
        expect(result[1].toString()).toMatch(/^-?\d+\.\d{6,}$/)
      })
    })
  })
})
