import CircleGeometryCalculator from './circle-geometry-calculator.js'
import FeatureFactory from './feature-factory.js'

jest.mock('./circle-geometry-calculator.js', () => ({
  default: {
    createGeographicCircle: jest.fn()
  }
}))

describe('FeatureFactory', () => {
  let featureFactory
  let mockOlModules
  let mockGeoJSONFormat

  beforeEach(() => {
    jest.clearAllMocks()

    CircleGeometryCalculator.createGeographicCircle = jest.fn()

    mockOlModules = {
      Feature: jest.fn(),
      Point: jest.fn(),
      Polygon: jest.fn(),
      fromLonLat: jest.fn(),
      toLonLat: jest.fn()
    }

    mockGeoJSONFormat = {
      readFeatures: jest.fn()
    }

    featureFactory = new FeatureFactory()
  })

  describe('createPointFeature', () => {
    test('should create point feature with correct geometry', () => {
      const coordinates = [1000, 2000]
      const mockPoint = {}
      const mockFeature = {}

      mockOlModules.Point.mockReturnValue(mockPoint)
      mockOlModules.Feature.mockReturnValue(mockFeature)

      const result = featureFactory.createPointFeature(
        mockOlModules,
        coordinates
      )

      expect(mockOlModules.Point).toHaveBeenCalledWith(coordinates)
      expect(mockOlModules.Feature).toHaveBeenCalledWith({
        geometry: mockPoint
      })
      expect(result).toBe(mockFeature)
    })
  })

  describe('createCircleFeature', () => {
    test('should create circle feature with correct geometry', () => {
      const centreCoordinates = [1000, 2000]
      const diameterInMetres = 500
      const centreWGS84 = [0, 51]
      const circleCoords = [
        [0, 51],
        [0.1, 51],
        [0, 51]
      ]
      const mockPolygon = {}
      const mockFeature = {}

      mockOlModules.toLonLat.mockReturnValue(centreWGS84)
      mockOlModules.fromLonLat.mockImplementation((coord) =>
        coord.map((c) => c * 1000)
      )
      mockOlModules.Polygon.mockReturnValue(mockPolygon)
      mockOlModules.Feature.mockReturnValue(mockFeature)
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
          [0, 51000],
          [100, 51000],
          [0, 51000]
        ]
      ])
      expect(mockOlModules.Feature).toHaveBeenCalledWith({
        geometry: mockPolygon
      })
      expect(result).toBe(mockFeature)
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
