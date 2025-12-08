import { vi } from 'vitest'
import CircleGeometryCalculator from './circle-geometry-calculator.js'
import FeatureFactory from './feature-factory.js'

vi.mock('./circle-geometry-calculator.js', () => ({
  default: {
    createGeographicCircle: vi.fn()
  }
}))

describe('FeatureFactory', () => {
  let featureFactory
  let mockOlModules
  let mockGeoJSONFormat

  beforeEach(() => {
    CircleGeometryCalculator.createGeographicCircle = vi.fn()

    mockOlModules = {
      Feature: vi.fn(function () {}),
      Polygon: vi.fn(function () {}),
      fromLonLat: vi.fn(),
      toLonLat: vi.fn()
    }

    mockGeoJSONFormat = {
      readFeatures: vi.fn()
    }

    featureFactory = new FeatureFactory()
  })

  describe('createCircleFeature', () => {
    test('should create circle feature with correct geometry', () => {
      const centreCoordinates = [56000, 6708000]
      const diameterInMetres = 500
      const centreWGS84 = [0.7, 51.55]
      const circleCoords = [
        [0.7, 51.55],
        [0.8, 51.55],
        [0.7, 51.55]
      ]
      const mockPolygon = {}
      const mockFeature = {}

      mockOlModules.toLonLat.mockReturnValue(centreWGS84)
      mockOlModules.fromLonLat.mockImplementation((coord) =>
        coord.map((c) => c * 1000)
      )
      mockOlModules.Polygon.mockImplementation(function () {
        return mockPolygon
      })
      mockOlModules.Feature.mockImplementation(function () {
        return mockFeature
      })
      CircleGeometryCalculator.createGeographicCircle.mockReturnValue(
        circleCoords
      )

      const result = featureFactory.createCircleFeature(
        mockOlModules,
        centreCoordinates,
        diameterInMetres
      )

      expect(mockOlModules.toLonLat).toHaveBeenCalledWith(centreCoordinates)
      expect(
        CircleGeometryCalculator.createGeographicCircle
      ).toHaveBeenCalledWith(centreWGS84, diameterInMetres / 2)
      expect(mockOlModules.Polygon).toHaveBeenCalledWith([
        [
          [700, 51550],
          [800, 51550],
          [700, 51550]
        ]
      ])
      expect(mockOlModules.Feature).toHaveBeenCalledWith({
        geometry: mockPolygon
      })
      expect(result).toBe(mockFeature)
    })
  })

  describe('createPolygonFeature', () => {
    const setupPolygonMocks = () => {
      const mockPolygon = {}
      const mockFeature = {}
      mockOlModules.Polygon.mockImplementation(function () {
        return mockPolygon
      })
      mockOlModules.Feature.mockImplementation(function () {
        return mockFeature
      })
      return { mockPolygon, mockFeature }
    }

    test('should create polygon feature with correct geometry', () => {
      const coordinatesArray = [
        [56000, 6708000],
        [78000, 6698000],
        [89000, 6680000]
      ]
      const { mockPolygon, mockFeature } = setupPolygonMocks()

      const result = featureFactory.createPolygonFeature(
        mockOlModules,
        coordinatesArray
      )

      expect(mockOlModules.Polygon).toHaveBeenCalledWith([
        [
          [56000, 6708000],
          [78000, 6698000],
          [89000, 6680000],
          [56000, 6708000]
        ]
      ])
      expect(mockOlModules.Feature).toHaveBeenCalledWith({
        geometry: mockPolygon
      })
      expect(result).toBe(mockFeature)
    })

    test('should close unclosed polygon by adding first coordinate', () => {
      const coordinatesArray = [
        [1000, 2000],
        [1100, 2100],
        [1200, 2200]
      ]
      setupPolygonMocks()

      featureFactory.createPolygonFeature(mockOlModules, coordinatesArray)

      const expectedClosedCoordinates = [
        [1000, 2000],
        [1100, 2100],
        [1200, 2200],
        [1000, 2000]
      ]
      expect(mockOlModules.Polygon).toHaveBeenCalledWith([
        expectedClosedCoordinates
      ])
    })

    test.each([
      {
        description:
          'should not duplicate first coordinate if polygon already closed',
        coordinatesArray: [
          [1000, 2000],
          [1100, 2100],
          [1200, 2200],
          [1000, 2000]
        ]
      },
      {
        description:
          'should handle coordinates with identical first and last points',
        coordinatesArray: [
          [1000, 2000],
          [1100, 2100],
          [1200, 2200],
          [1000, 2000]
        ]
      }
    ])('$description', ({ coordinatesArray }) => {
      setupPolygonMocks()

      featureFactory.createPolygonFeature(mockOlModules, coordinatesArray)

      expect(mockOlModules.Polygon).toHaveBeenCalledWith([coordinatesArray])
    })

    test.each([
      {
        description: 'insufficient coordinates',
        coordinatesArray: [
          [1000, 2000],
          [1100, 2100]
        ]
      },
      {
        description: 'null coordinates array',
        coordinatesArray: null
      },
      {
        description: 'undefined coordinates array',
        coordinatesArray: undefined
      },
      {
        description: 'empty coordinates array',
        coordinatesArray: []
      }
    ])('should return null for $description', ({ coordinatesArray }) => {
      const result = featureFactory.createPolygonFeature(
        mockOlModules,
        coordinatesArray
      )

      expect(result).toBeNull()
      expect(mockOlModules.Polygon).not.toHaveBeenCalled()
      expect(mockOlModules.Feature).not.toHaveBeenCalled()
    })
  })

  describe('createFeaturesFromGeoJSON', () => {
    test('should create features from valid geoJSON', () => {
      const geoJSON = { features: [{ geometry: {}, properties: {} }] }
      const mockFeatures = ['feature1', 'feature2']
      mockGeoJSONFormat.readFeatures.mockReturnValue(mockFeatures)

      const result = featureFactory.createFeaturesFromGeoJSON(
        mockGeoJSONFormat,
        geoJSON
      )

      expect(mockGeoJSONFormat.readFeatures).toHaveBeenCalledWith(geoJSON, {
        featureProjection: 'EPSG:3857'
      })
      expect(result).toBe(mockFeatures)
    })

    test('should return empty array for invalid geoJSON', () => {
      const invalidGeoJSON = {}

      const result = featureFactory.createFeaturesFromGeoJSON(
        mockGeoJSONFormat,
        invalidGeoJSON
      )

      expect(mockGeoJSONFormat.readFeatures).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    test('should return empty array for geoJSON with non-array features', () => {
      const invalidGeoJSON = { features: 'not-array' }

      const result = featureFactory.createFeaturesFromGeoJSON(
        mockGeoJSONFormat,
        invalidGeoJSON
      )

      expect(mockGeoJSONFormat.readFeatures).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    test('should return empty array for geoJSON with null features', () => {
      const invalidGeoJSON = { features: null }

      const result = featureFactory.createFeaturesFromGeoJSON(
        mockGeoJSONFormat,
        invalidGeoJSON
      )

      expect(mockGeoJSONFormat.readFeatures).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })
})
