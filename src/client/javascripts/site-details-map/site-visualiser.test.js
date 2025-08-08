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
    createPolygonFeature: jest.fn(),
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

    MapViewManager.mockClear()
    FeatureFactory.mockClear()

    mockMapViewManager = {
      fitMapToExtent: jest.fn(),
      fitMapToGeometry: jest.fn(),
      fitMapToAllFeatures: jest.fn(),
      centreMapView: jest.fn()
    }

    mockFeatureFactory = {
      createPointFeature: jest.fn(),
      createCircleFeature: jest.fn(),
      createPolygonFeature: jest.fn(),
      createFeaturesFromGeoJSON: jest.fn()
    }

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

  const getTestCoordinates = () => [56000, 6708000]
  const getValidPolygonCoordinates = () => [
    [56000, 6708000],
    [78000, 6698000],
    [89000, 6680000],
    [67000, 6675000],
    [45000, 6695000]
  ]
  const createBasicMockFeature = () => ({})
  const createMockFeatureWithGeometry = (
    geometry = { mockGeometry: true }
  ) => ({
    getGeometry: jest.fn().mockReturnValue(geometry)
  })

  const getFeatureDisplayTestData = () => ({
    point: {
      method: 'displayPointSite',
      factoryMethod: 'createPointFeature',
      coordinates: getTestCoordinates(),
      args: [getTestCoordinates()]
    },
    circle: {
      method: 'displayCircularSite',
      factoryMethod: 'createCircleFeature',
      coordinates: getTestCoordinates(),
      diameter: 500,
      args: [getTestCoordinates(), 500]
    },
    polygon: {
      method: 'displayPolygonSite',
      factoryMethod: 'createPolygonFeature',
      coordinates: getValidPolygonCoordinates(),
      args: [getValidPolygonCoordinates()]
    }
  })

  describe('feature display methods', () => {
    test.each([
      ['point', 'displayPointSite', 'createPointFeature'],
      ['circle', 'displayCircularSite', 'createCircleFeature'],
      ['polygon', 'displayPolygonSite', 'createPolygonFeature']
    ])(
      'should create %s feature and add to vector source',
      (featureType, displayMethod, factoryMethod) => {
        const testData = getFeatureDisplayTestData()[featureType]
        const mockFeature =
          featureType === 'point'
            ? createBasicMockFeature()
            : createMockFeatureWithGeometry()
        mockFeatureFactory[factoryMethod] = jest
          .fn()
          .mockReturnValue(mockFeature)

        siteVisualiser[displayMethod](...testData.args)

        expect(mockFeatureFactory[factoryMethod]).toHaveBeenCalledWith(
          mockOlModules,
          ...testData.args
        )
        expect(mockVectorSource.addFeature).toHaveBeenCalledWith(mockFeature)
      }
    )

    test.each([
      ['circle', 'displayCircularSite', 'createCircleFeature'],
      ['polygon', 'displayPolygonSite', 'createPolygonFeature']
    ])(
      'should fit map to %s geometry',
      (featureType, displayMethod, factoryMethod) => {
        const testData = getFeatureDisplayTestData()[featureType]
        const mockGeometry = { mockGeometry: true }
        const mockFeature = createMockFeatureWithGeometry(mockGeometry)
        mockFeatureFactory[factoryMethod] = jest
          .fn()
          .mockReturnValue(mockFeature)

        siteVisualiser[displayMethod](...testData.args)

        expect(mockMapViewManager.fitMapToGeometry).toHaveBeenCalledWith(
          mockMap,
          mockGeometry
        )
      }
    )
  })

  describe('displayPolygonSite edge cases', () => {
    const getInsufficientCoordinates = () => [
      [56000, 6708000],
      [78000, 6698000]
    ]

    const setupPolygonFeatureFactory = (returnValue) => {
      mockFeatureFactory.createPolygonFeature = jest
        .fn()
        .mockReturnValue(returnValue)
    }

    test.each([
      ['insufficient coordinates', getInsufficientCoordinates()],
      ['empty coordinates array', []],
      ['null coordinates array', null]
    ])(
      'should return early when polygon feature creation fails with %s',
      (description, coordinatesArray) => {
        setupPolygonFeatureFactory(null)

        siteVisualiser.displayPolygonSite(coordinatesArray)

        expect(mockFeatureFactory.createPolygonFeature).toHaveBeenCalledWith(
          mockOlModules,
          coordinatesArray
        )
        expect(mockVectorSource.addFeature).not.toHaveBeenCalled()
        expect(mockMapViewManager.fitMapToGeometry).not.toHaveBeenCalled()
      }
    )
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
      coordinates: { latitude: '51.550000', longitude: '0.700000' }
    }

    const expectEarlyReturn = () => {
      expect(siteVisualiser.displayCircularSite).not.toHaveBeenCalled()
      expect(siteVisualiser.displayPointSite).not.toHaveBeenCalled()
      expect(mockMapViewManager.centreMapView).not.toHaveBeenCalled()
    }

    const getThamesEstuaryCoordinates = () => [56000, 6708000]

    const setupCoordinateMock = (coordinates) => {
      mockCoordinateParser.parseCoordinates.mockReturnValue(coordinates)
    }

    const expectCircularSiteCall = (mapCoordinates, circleWidth) => {
      expect(siteVisualiser.displayCircularSite).toHaveBeenCalledWith(
        mapCoordinates,
        circleWidth
      )
      expect(siteVisualiser.displayPointSite).not.toHaveBeenCalled()
      expect(mockMapViewManager.centreMapView).not.toHaveBeenCalled()
    }

    const expectPointSiteCall = (mapCoordinates) => {
      expect(siteVisualiser.displayCircularSite).not.toHaveBeenCalled()
      expect(siteVisualiser.displayPointSite).toHaveBeenCalledWith(
        mapCoordinates
      )
      expect(mockMapViewManager.centreMapView).toHaveBeenCalledWith(
        mockMap,
        mapCoordinates,
        12
      )
    }

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

    test.each([
      [
        'circular site when circleWidth is provided',
        { ...commonSiteDetails, circleWidth: 100 },
        (mapCoordinates) => expectCircularSiteCall(mapCoordinates, 100)
      ],
      [
        'point site when no circleWidth provided',
        commonSiteDetails,
        (mapCoordinates) => expectPointSiteCall(mapCoordinates)
      ]
    ])('should display %s', (description, siteDetails, expectationFunction) => {
      expect.hasAssertions()
      const mapCoordinates = getThamesEstuaryCoordinates()
      setupCoordinateMock(mapCoordinates)

      siteVisualiser.displayManualCoordinates(siteDetails)

      expectationFunction(mapCoordinates)
    })

    test('should call parseCoordinates with correct parameters', () => {
      const siteDetails = {
        coordinateSystem: 'OSGB36',
        coordinates: { eastings: '577000', northings: '178000' }
      }
      const mapCoordinates = [3000, 4000]
      mockCoordinateParser.parseCoordinates.mockReturnValue(mapCoordinates)

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).toHaveBeenCalledWith(
        'OSGB36',
        { eastings: '577000', northings: '178000' },
        mockOlModules.fromLonLat
      )
    })
  })
})
