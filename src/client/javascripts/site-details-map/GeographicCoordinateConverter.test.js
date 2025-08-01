import GeographicCoordinateConverter from './GeographicCoordinateConverter.js'

describe('GeographicCoordinateConverter', () => {
  describe('osgb36ToWgs84', () => {
    describe('valid coordinate conversions', () => {
      test('should convert London coordinates correctly', () => {
        const osgbEasting = 530000
        const osgbNorthing = 180000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(typeof result[0]).toBe('number')
        expect(typeof result[1]).toBe('number')
        expect(result[0]).toBeCloseTo(0.0, 0)
        expect(result[1]).toBeCloseTo(51.5, 0)
      })

      test('should convert Edinburgh coordinates correctly', () => {
        const osgbEasting = 325000
        const osgbNorthing = 675000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(typeof result[0]).toBe('number')
        expect(typeof result[1]).toBe('number')
        expect(result[0]).toBeCloseTo(-3.2, 0)
        expect(result[1]).toBeCloseTo(55.9, 0)
      })

      test('should convert Brighton coordinates correctly', () => {
        const osgbEasting = 532000
        const osgbNorthing = 105000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(typeof result[0]).toBe('number')
        expect(typeof result[1]).toBe('number')
        expect(result[0]).toBeCloseTo(0.0, 0)
        expect(result[1]).toBeCloseTo(50.8, 0)
      })
    })

    describe('boundary values', () => {
      test('should handle minimum valid OSGB36 coordinates', () => {
        const osgbEasting = 100000
        const osgbNorthing = 0

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(typeof result[0]).toBe('number')
        expect(typeof result[1]).toBe('number')
      })

      test('should handle maximum valid OSGB36 coordinates', () => {
        const osgbEasting = 700000
        const osgbNorthing = 1300000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(typeof result[0]).toBe('number')
        expect(typeof result[1]).toBe('number')
      })
    })

    describe('precision requirements', () => {
      test('should return coordinates with sufficient precision for mapping', () => {
        const osgbEasting = 530000
        const osgbNorthing = 180000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        const longitude = result[0]
        const latitude = result[1]

        expect(longitude.toString()).toMatch(/^-?\d+\.\d{6,}$/)
        expect(latitude.toString()).toMatch(/^-?\d+\.\d{6,}$/)
      })

      test('should produce consistent results for same input', () => {
        const osgbEasting = 400000
        const osgbNorthing = 300000

        const result1 = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )
        const result2 = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        expect(result1).toEqual(result2)
      })
    })

    describe('coordinate format validation', () => {
      test('should return longitude first, latitude second', () => {
        const osgbEasting = 530000
        const osgbNorthing = 180000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        const longitude = result[0]
        const latitude = result[1]

        expect(longitude).toBeGreaterThan(-180)
        expect(longitude).toBeLessThan(180)
        expect(latitude).toBeGreaterThan(-90)
        expect(latitude).toBeLessThan(90)
      })

      test('should return valid UK coordinates within expected bounds', () => {
        const osgbEasting = 400000
        const osgbNorthing = 400000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        const longitude = result[0]
        const latitude = result[1]

        expect(longitude).toBeGreaterThan(-8)
        expect(longitude).toBeLessThan(2)
        expect(latitude).toBeGreaterThan(49)
        expect(latitude).toBeLessThan(61)
      })
    })

    describe('marine licensing coordinate examples', () => {
      test('should convert coastal coordinates accurately', () => {
        const osgbEasting = 450000
        const osgbNorthing = 200000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)

        const longitude = result[0]
        const latitude = result[1]

        expect(longitude).toBeCloseTo(-1.0, 0)
        expect(latitude).toBeCloseTo(51.7, 0)
      })

      test('should convert offshore coordinates accurately', () => {
        const osgbEasting = 500000
        const osgbNorthing = 500000

        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          osgbEasting,
          osgbNorthing
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)

        const longitude = result[0]
        const latitude = result[1]

        expect(typeof longitude).toBe('number')
        expect(typeof latitude).toBe('number')
        expect(isFinite(longitude)).toBe(true)
        expect(isFinite(latitude)).toBe(true)
      })
    })

    describe('input handling', () => {
      test('should handle integer coordinates', () => {
        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          400000,
          300000
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
      })

      test('should handle floating point coordinates', () => {
        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          400000.5,
          300000.7
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
      })

      test('should handle negative coordinates', () => {
        const result = GeographicCoordinateConverter.osgb36ToWgs84(
          -100000,
          -50000
        )

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
      })
    })
  })
})
