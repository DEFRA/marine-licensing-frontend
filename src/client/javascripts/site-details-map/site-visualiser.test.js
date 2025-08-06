import CircleGeometryCalculator from './circle-geometry-calculator.js'
import FeatureFactory from './feature-factory.js'
import MapViewManager from './map-view-manager.js'
import SiteVisualiser from './site-visualiser.js'

jest.mock('./circle-geometry-calculator.js', () => ({
  default: {
    createGeographicCircle: jest.fn()
  }
}))

jest.mock('./map-view-manager.js', () => {
  return jest.fn().mockImplementation(() => ({
    fitMapToExtent: jest.fn(),
    fitMapToGeometry: jest.fn(),
    fitMapToAllFeatures: jest.fn(),
    centreMapView: jest.fn()
  }))
})

jest.mock('./feature-factory.js', () => {
  return jest.fn().mockImplementation(() => ({
    createPointFeature: jest.fn(),
    createCircleFeature: jest.fn(),
    createFeaturesFromGeoJSON: jest.fn()
  }))
})

describe('SiteVisualiser', () => {
  let siteVisualiser
  let mockOlModules
  let mockVectorSource
  let mockGeoJSONFormat
  let mockMap
  let mockMapViewManager
  let mockFeatureFactory

  beforeEach(() => {
    jest.clearAllMocks()

    CircleGeometryCalculator.createGeographicCircle = jest.fn()

    // Clear the constructor mocks
    MapViewManager.mockClear()
    FeatureFactory.mockClear()

    // Create mock instances that will be returned by the constructors
    mockMapViewManager = {
      fitMapToExtent: jest.fn(),
      fitMapToGeometry: jest.fn(),
      fitMapToAllFeatures: jest.fn(),
      centreMapView: jest.fn()
    }

    mockFeatureFactory = {
      createPointFeature: jest.fn(),
      createCircleFeature: jest.fn(),
      createFeaturesFromGeoJSON: jest.fn()
    }

    // Make the constructors return our mock instances
    MapViewManager.mockImplementation(() => mockMapViewManager)
    FeatureFactory.mockImplementation(() => mockFeatureFactory)

    mockOlModules = {
      Feature: jest.fn(),
      Point: jest.fn(),
      Polygon: jest.fn(),
      fromLonLat: jest.fn(),
      toLonLat: jest.fn()
    }

    mockVectorSource = {
      addFeature: jest.fn(),
      addFeatures: jest.fn(),
      clear: jest.fn(),
      getExtent: jest.fn()
    }

    mockGeoJSONFormat = {
      readFeatures: jest.fn()
    }

    mockMap = {
      getView: jest.fn().mockReturnValue({
        fit: jest.fn(),
        setCenter: jest.fn(),
        setZoom: jest.fn()
      })
    }

    siteVisualiser = new SiteVisualiser(
      mockOlModules,
      mockVectorSource,
      mockGeoJSONFormat,
      mockMap
    )
  })

  describe('displayPointSite', () => {
    test('should create and add point feature', () => {
      const coordinates = [1000, 2000]
      const mockFeature = {}

      mockFeatureFactory.createPointFeature.mockReturnValue(mockFeature)

      siteVisualiser.displayPointSite(coordinates)

      expect(mockFeatureFactory.createPointFeature).toHaveBeenCalledWith(
        mockOlModules,
        coordinates
      )
      expect(mockVectorSource.addFeature).toHaveBeenCalledWith(mockFeature)
    })
  })

  describe('displayCircularSite', () => {
    test('should create circle feature and add to vector source', () => {
      const centreCoordinates = [1000, 2000]
      const diameterInMetres = 500
      const mockFeature = {
        getGeometry: jest.fn().mockReturnValue({ mockGeometry: true })
      }

      mockFeatureFactory.createCircleFeature.mockReturnValue(mockFeature)

      siteVisualiser.displayCircularSite(centreCoordinates, diameterInMetres)

      expect(mockFeatureFactory.createCircleFeature).toHaveBeenCalledWith(
        mockOlModules,
        centreCoordinates,
        diameterInMetres
      )
      expect(mockVectorSource.addFeature).toHaveBeenCalledWith(mockFeature)
    })

    test('should fit map to circle geometry', () => {
      const centreCoordinates = [1000, 2000]
      const diameterInMetres = 500
      const mockGeometry = { mockGeometry: true }
      const mockFeature = {
        getGeometry: jest.fn().mockReturnValue(mockGeometry)
      }

      mockFeatureFactory.createCircleFeature.mockReturnValue(mockFeature)

      siteVisualiser.displayCircularSite(centreCoordinates, diameterInMetres)

      expect(mockMapViewManager.fitMapToGeometry).toHaveBeenCalledWith(
        mockMap,
        mockGeometry
      )
    })
  })

  describe('displayFileUploadData', () => {
    test.each([
      ['invalid geoJSON', {}],
      ['geoJSON with non-array features', { features: 'not-array' }],
      ['geoJSON with empty features array', { features: [] }]
    ])('should return early for %s', (description, geoJSON) => {
      mockFeatureFactory.createFeaturesFromGeoJSON.mockReturnValue([])

      siteVisualiser.displayFileUploadData(geoJSON)

      expect(mockFeatureFactory.createFeaturesFromGeoJSON).toHaveBeenCalledWith(
        mockGeoJSONFormat,
        geoJSON
      )
      expect(mockVectorSource.addFeatures).not.toHaveBeenCalled()
      expect(mockMapViewManager.fitMapToAllFeatures).not.toHaveBeenCalled()
    })

    test('should process valid geoJSON features', () => {
      const geoJSON = { features: [{ geometry: {}, properties: {} }] }
      const mockFeatures = ['feature1', 'feature2']
      mockFeatureFactory.createFeaturesFromGeoJSON.mockReturnValue(mockFeatures)

      siteVisualiser.displayFileUploadData(geoJSON)

      expect(mockFeatureFactory.createFeaturesFromGeoJSON).toHaveBeenCalledWith(
        mockGeoJSONFormat,
        geoJSON
      )
      expect(mockVectorSource.addFeatures).toHaveBeenCalledWith(mockFeatures)
      expect(mockMapViewManager.fitMapToAllFeatures).toHaveBeenCalledWith(
        mockMap,
        mockVectorSource
      )
    })
  })

  describe('clearFeatures', () => {
    test('should clear all features from vector source', () => {
      siteVisualiser.clearFeatures()

      expect(mockVectorSource.clear).toHaveBeenCalled()
    })
  })

  describe('displayManualCoordinates', () => {
    let mockCoordinateParser

    const commonSiteDetails = {
      coordinateSystem: 'WGS84',
      coordinates: { latitude: '51.5', longitude: '-0.1' }
    }

    const expectEarlyReturn = () => {
      expect(siteVisualiser.displayCircularSite).not.toHaveBeenCalled()
      expect(siteVisualiser.displayPointSite).not.toHaveBeenCalled()
      expect(mockMapViewManager.centreMapView).not.toHaveBeenCalled()
    }

    const getTestCoordinates = () => [1000, 2000]

    const setupCoordinateMock = (coordinates) => {
      mockCoordinateParser.parseCoordinates.mockReturnValue(coordinates)
    }

    const getCircularSiteExpectations = (mapCoordinates, circleWidth) => ({
      displayCircularSite: {
        called: true,
        args: [mapCoordinates, circleWidth]
      },
      displayPointSite: { called: false },
      centreMapView: { called: false }
    })

    const getPointSiteExpectations = (mapCoordinates) => ({
      displayCircularSite: { called: false },
      displayPointSite: { called: true, args: [mapCoordinates] },
      centreMapView: { called: true, args: [mockMap, mapCoordinates, 14] }
    })

    beforeEach(() => {
      mockCoordinateParser = {
        parseCoordinates: jest.fn()
      }
      siteVisualiser.coordinateParser = mockCoordinateParser
      jest.spyOn(siteVisualiser, 'displayCircularSite').mockImplementation()
      jest.spyOn(siteVisualiser, 'displayPointSite').mockImplementation()
    })

    test('should return early when no coordinates provided', () => {
      const siteDetails = { coordinateSystem: 'WGS84' }

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).not.toHaveBeenCalled()
      expectEarlyReturn()
    })

    test('should return early when fromLonLat is not available', () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      siteVisualiser.olModules = {}

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).not.toHaveBeenCalled()
      expectEarlyReturn()
    })

    test('should return early when parseCoordinates returns null', () => {
      mockCoordinateParser.parseCoordinates.mockReturnValue(null)

      siteVisualiser.displayManualCoordinates(commonSiteDetails)

      expect(mockCoordinateParser.parseCoordinates).toHaveBeenCalledWith(
        commonSiteDetails.coordinateSystem,
        commonSiteDetails.coordinates,
        mockOlModules.fromLonLat
      )
      expectEarlyReturn()
    })

    test('should display circular site when circleWidth is provided', () => {
      const siteDetailsWithCircle = { ...commonSiteDetails, circleWidth: 100 }
      const mapCoordinates = getTestCoordinates()
      setupCoordinateMock(mapCoordinates)

      siteVisualiser.displayManualCoordinates(siteDetailsWithCircle)

      const expectations = getCircularSiteExpectations(mapCoordinates, 100)
      expect(siteVisualiser.displayCircularSite).toHaveBeenCalledWith(
        ...expectations.displayCircularSite.args
      )
      expect(siteVisualiser.displayPointSite).not.toHaveBeenCalled()
      expect(mockMapViewManager.centreMapView).not.toHaveBeenCalled()
    })

    test('should display point site when no circleWidth provided', () => {
      const mapCoordinates = getTestCoordinates()
      setupCoordinateMock(mapCoordinates)

      siteVisualiser.displayManualCoordinates(commonSiteDetails)

      const expectations = getPointSiteExpectations(mapCoordinates)
      expect(siteVisualiser.displayPointSite).toHaveBeenCalledWith(
        ...expectations.displayPointSite.args
      )
      expect(siteVisualiser.displayCircularSite).not.toHaveBeenCalled()
      expect(mockMapViewManager.centreMapView).toHaveBeenCalledWith(
        ...expectations.centreMapView.args
      )
    })

    test('should call parseCoordinates with correct parameters', () => {
      const siteDetails = {
        coordinateSystem: 'OSGB36',
        coordinates: { eastings: '530000', northings: '180000' }
      }
      const mapCoordinates = [3000, 4000]
      mockCoordinateParser.parseCoordinates.mockReturnValue(mapCoordinates)

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).toHaveBeenCalledWith(
        'OSGB36',
        { eastings: '530000', northings: '180000' },
        mockOlModules.fromLonLat
      )
    })
  })
})
