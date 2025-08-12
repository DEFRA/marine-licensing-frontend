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
      expect(mockMapViewManager.centreMapView).not.toHaveBeenCalled()
    }

    const setupCoordinateDisplayTest = (
      coordinatesEntry,
      coordinates,
      circleWidth
    ) => {
      const siteDetails = {
        ...commonSiteDetails,
        coordinatesEntry,
        circleWidth
      }
      mockCoordinateParser.parseCoordinates.mockReturnValue(coordinates)
      jest.spyOn(siteVisualiser, 'displayPolygonSite').mockImplementation()

      return { siteDetails, coordinates }
    }

    beforeEach(() => {
      mockCoordinateParser = {
        parseCoordinates: jest.fn()
      }
      siteVisualiser.coordinateParser = mockCoordinateParser
      jest.spyOn(siteVisualiser, 'displayCircularSite').mockImplementation()
    })

    test('handles missing site coordinates gracefully', () => {
      const siteDetails = { coordinateSystem: 'WGS84' }

      const result = siteVisualiser.displayManualCoordinates(siteDetails)

      expect(result).toBe('no-coordinates')
      expect(mockCoordinateParser.parseCoordinates).not.toHaveBeenCalled()
      expectEarlyReturn()
    })

    test('handles map projection library unavailability gracefully', () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      siteVisualiser.olModules = {}

      const result = siteVisualiser.displayManualCoordinates(siteDetails)

      expect(result).toBe('modules-unavailable')
      expect(mockCoordinateParser.parseCoordinates).not.toHaveBeenCalled()
      expectEarlyReturn()
    })

    test('handles malformed or invalid coordinates gracefully', () => {
      mockCoordinateParser.parseCoordinates.mockReturnValue(null)

      const result = siteVisualiser.displayManualCoordinates(commonSiteDetails)

      expect(result).toBe('invalid-coordinates')
      expect(mockCoordinateParser.parseCoordinates).toHaveBeenCalledWith(
        commonSiteDetails.coordinateSystem,
        commonSiteDetails.coordinates,
        mockOlModules.fromLonLat
      )
      expectEarlyReturn()
    })

    test('displays circular site boundary when width is specified', () => {
      const siteDetails = { ...commonSiteDetails, circleWidth: 100 }
      const mapCoordinates = getThamesEstuaryCoordinates()
      setupCoordinateMock(mapCoordinates)

      const result = siteVisualiser.displayManualCoordinates(siteDetails)

      expect(result).toBe('circle')
      expectCircularSiteCall(mapCoordinates, 100)
    })

    test('displays polygon site boundary for multiple coordinate points', () => {
      const polygonCoordinates = getValidPolygonCoordinates()
      const { siteDetails, coordinates } = setupCoordinateDisplayTest(
        'multiple',
        polygonCoordinates
      )

      const result = siteVisualiser.displayManualCoordinates(siteDetails)

      expect(result).toBe('polygon')
      expect(siteVisualiser.displayPolygonSite).toHaveBeenCalledWith(
        coordinates
      )
      expect(siteVisualiser.displayCircularSite).not.toHaveBeenCalled()
    })

    test.each([
      {
        description:
          'displays circle for single coordinate point with specified width',
        coordinatesEntry: 'single',
        coordinatesFactory: () => getThamesEstuaryCoordinates(),
        circleWidth: 50
      },
      {
        description:
          'displays circle for single coordinate even when marked as multiple',
        coordinatesEntry: 'multiple',
        coordinatesFactory: () => ({ x: 56000, y: 6708000 }),
        circleWidth: 75
      }
    ])(
      '$description',
      ({ coordinatesEntry, coordinatesFactory, circleWidth }) => {
        const coordinates = coordinatesFactory()
        const { siteDetails, coordinates: testCoordinates } =
          setupCoordinateDisplayTest(coordinatesEntry, coordinates, circleWidth)

        const result = siteVisualiser.displayManualCoordinates(siteDetails)

        expect(result).toBe('circle')
        expect(siteVisualiser.displayPolygonSite).not.toHaveBeenCalled()
        expect(siteVisualiser.displayCircularSite).toHaveBeenCalledWith(
          testCoordinates,
          circleWidth
        )
      }
    )

    test('takes no action when single coordinate lacks width specification', () => {
      const singleCoordinate = { x: 56000, y: 6708000 }
      const { siteDetails } = setupCoordinateDisplayTest(
        'single',
        singleCoordinate
      )

      const result = siteVisualiser.displayManualCoordinates(siteDetails)

      expect(result).toBe('no-action')
      expect(siteVisualiser.displayPolygonSite).not.toHaveBeenCalled()
      expect(siteVisualiser.displayCircularSite).not.toHaveBeenCalled()
    })

    test('processes OSGB36 coordinate system correctly', () => {
      const siteDetails = {
        coordinateSystem: 'OSGB36',
        coordinates: { eastings: '577000', northings: '178000' },
        circleWidth: 100
      }
      const mapCoordinates = [3000, 4000]
      mockCoordinateParser.parseCoordinates.mockReturnValue(mapCoordinates)

      const result = siteVisualiser.displayManualCoordinates(siteDetails)

      expect(result).toBe('circle')
      expect(mockCoordinateParser.parseCoordinates).toHaveBeenCalledWith(
        'OSGB36',
        { eastings: '577000', northings: '178000' },
        mockOlModules.fromLonLat
      )
    })
  })
})
