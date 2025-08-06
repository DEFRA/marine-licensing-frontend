import CircleGeometryCalculator from './circle-geometry-calculator.js'
import SiteVisualiser from './site-visualiser.js'

jest.mock('./circle-geometry-calculator.js', () => ({
  default: {
    createGeographicCircle: jest.fn()
  }
}))

describe('SiteVisualiser', () => {
  let siteVisualiser
  let mockOlModules
  let mockVectorSource
  let mockGeoJSONFormat
  let mockMap

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
      const mockPoint = {}

      mockOlModules.Feature.mockReturnValue(mockFeature)
      mockOlModules.Point.mockReturnValue(mockPoint)

      siteVisualiser.displayPointSite(coordinates)

      expect(mockOlModules.Point).toHaveBeenCalledWith(coordinates)
      expect(mockOlModules.Feature).toHaveBeenCalledWith({
        geometry: mockPoint
      })
      expect(mockOlModules.Feature).not.toHaveBeenCalledWith({})
      expect(mockVectorSource.addFeature).toHaveBeenCalledWith(mockFeature)
    })
  })

  const setupCircularSiteTest = () => {
    const setup = {
      centreCoordinates: [1000, 2000],
      radiusInMetres: 500,
      centreWGS84: [0, 51],
      circleCoords: [
        [0, 51],
        [0.1, 51],
        [0, 51]
      ],
      mocks: {
        feature: {},
        polygon: {}
      }
    }

    mockOlModules.Feature.mockReturnValue(setup.mocks.feature)
    mockOlModules.Polygon.mockReturnValue(setup.mocks.polygon)
    mockOlModules.toLonLat.mockReturnValue(setup.centreWGS84)
    mockOlModules.fromLonLat.mockImplementation((coord) =>
      coord.map((c) => c * 1000)
    )
    CircleGeometryCalculator.createGeographicCircle.mockReturnValue(
      setup.circleCoords
    )

    return setup
  }

  describe('displayCircularSite', () => {
    let setup

    beforeEach(() => {
      setup = setupCircularSiteTest()
      siteVisualiser.displayCircularSite(
        setup.centreCoordinates,
        setup.radiusInMetres
      )
    })

    test('should convert centre coordinates to WGS84', () => {
      expect(mockOlModules.toLonLat).toHaveBeenCalledWith(
        setup.centreCoordinates
      )
    })

    test('should calculate geographic circle with correct parameters', () => {
      expect(
        CircleGeometryCalculator.createGeographicCircle
      ).toHaveBeenCalledWith(setup.centreWGS84, setup.radiusInMetres)
    })

    test('should project circle coordinates to map projection', () => {
      expect(mockOlModules.Polygon).toHaveBeenCalledWith([
        [
          [0, 51000],
          [100, 51000],
          [0, 51000]
        ]
      ])
    })

    test('should create feature with polygon geometry', () => {
      expect(mockOlModules.Feature).toHaveBeenCalledWith({
        geometry: setup.mocks.polygon
      })
    })

    test('should add created feature to vector source', () => {
      expect(mockVectorSource.addFeature).toHaveBeenCalledWith(
        setup.mocks.feature
      )
    })
  })

  describe('displayFileUploadData', () => {
    test('should return early for invalid geoJSON', () => {
      siteVisualiser.displayFileUploadData({})

      expect(mockGeoJSONFormat.readFeatures).not.toHaveBeenCalled()
    })

    test('should return early for geoJSON with non-array features', () => {
      siteVisualiser.displayFileUploadData({ features: 'not-array' })

      expect(mockGeoJSONFormat.readFeatures).not.toHaveBeenCalled()
    })

    test('should process valid geoJSON features', () => {
      const geoJSON = { features: [{ geometry: {}, properties: {} }] }
      const mockFeatures = ['feature1', 'feature2']
      mockGeoJSONFormat.readFeatures.mockReturnValue(mockFeatures)

      siteVisualiser.displayFileUploadData(geoJSON)

      expect(mockGeoJSONFormat.readFeatures).toHaveBeenCalledWith(geoJSON, {
        featureProjection: 'EPSG:3857'
      })
      expect(mockVectorSource.addFeatures).toHaveBeenCalledWith(mockFeatures)
    })

    test('should fit map view when features exist', () => {
      const geoJSON = { features: [{}] }
      const mockFeatures = ['feature1']
      const mockExtent = [0, 0, 100, 100]

      mockGeoJSONFormat.readFeatures.mockReturnValue(mockFeatures)
      mockVectorSource.getExtent.mockReturnValue(mockExtent)

      siteVisualiser.displayFileUploadData(geoJSON)

      expect(mockMap.getView().fit).toHaveBeenCalledWith(mockExtent, {
        padding: [20, 20, 20, 20],
        maxZoom: 16
      })
    })

    test('should not fit map view when no features', () => {
      const geoJSON = { features: [] }
      const mockFeatures = []

      mockGeoJSONFormat.readFeatures.mockReturnValue(mockFeatures)

      siteVisualiser.displayFileUploadData(geoJSON)

      expect(mockMap.getView().fit).not.toHaveBeenCalled()
    })
  })

  describe('clearFeatures', () => {
    test('should clear all features from vector source', () => {
      siteVisualiser.clearFeatures()

      expect(mockVectorSource.clear).toHaveBeenCalled()
    })
  })

  describe('centreMapView', () => {
    test('should centre map on coordinates with default zoom', () => {
      const coordinates = [1000, 2000]

      siteVisualiser.centreMapView(coordinates)

      expect(mockMap.getView().setCenter).toHaveBeenCalledWith(coordinates)
      expect(mockMap.getView().setZoom).toHaveBeenCalledWith(14)
    })

    test('should centre map on coordinates with custom zoom', () => {
      const coordinates = [1000, 2000]
      const zoomLevel = 10

      siteVisualiser.centreMapView(coordinates, zoomLevel)

      expect(mockMap.getView().setCenter).toHaveBeenCalledWith(coordinates)
      expect(mockMap.getView().setZoom).toHaveBeenCalledWith(zoomLevel)
    })
  })

  describe('displayManualCoordinates', () => {
    let mockCoordinateParser

    beforeEach(() => {
      mockCoordinateParser = {
        parseCoordinates: jest.fn()
      }
      siteVisualiser.coordinateParser = mockCoordinateParser
      jest.spyOn(siteVisualiser, 'displayCircularSite').mockImplementation()
      jest.spyOn(siteVisualiser, 'displayPointSite').mockImplementation()
      jest.spyOn(siteVisualiser, 'centreMapView').mockImplementation()
    })

    const expectNoMethodsCalled = () => {
      expect(siteVisualiser.displayCircularSite).not.toHaveBeenCalled()
      expect(siteVisualiser.displayPointSite).not.toHaveBeenCalled()
      expect(siteVisualiser.centreMapView).not.toHaveBeenCalled()
    }

    test('should return early when no coordinates provided', () => {
      const siteDetails = { coordinateSystem: 'WGS84' }

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).not.toHaveBeenCalled()
      expectNoMethodsCalled()
    })

    test('should return early when fromLonLat is not available', () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      siteVisualiser.olModules = {}

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).not.toHaveBeenCalled()
      expectNoMethodsCalled()
    })

    test('should return early when parseCoordinates returns null', () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      mockCoordinateParser.parseCoordinates.mockReturnValue(null)

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).toHaveBeenCalledWith(
        'WGS84',
        { latitude: '51.5', longitude: '-0.1' },
        mockOlModules.fromLonLat
      )
      expectNoMethodsCalled()
    })

    test('should display circular site when circleWidth is provided', () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5', longitude: '-0.1' },
        circleWidth: 100
      }
      const mapCoordinates = [1000, 2000]
      mockCoordinateParser.parseCoordinates.mockReturnValue(mapCoordinates)

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(siteVisualiser.displayCircularSite).toHaveBeenCalledWith(
        mapCoordinates,
        100
      )
      expect(siteVisualiser.displayPointSite).not.toHaveBeenCalled()
      expect(siteVisualiser.centreMapView).toHaveBeenCalledWith(
        mapCoordinates,
        14
      )
    })

    test('should display point site when no circleWidth provided', () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      const mapCoordinates = [1000, 2000]
      mockCoordinateParser.parseCoordinates.mockReturnValue(mapCoordinates)

      siteVisualiser.displayManualCoordinates(siteDetails)

      expect(siteVisualiser.displayPointSite).toHaveBeenCalledWith(
        mapCoordinates
      )
      expect(siteVisualiser.displayCircularSite).not.toHaveBeenCalled()
      expect(siteVisualiser.centreMapView).toHaveBeenCalledWith(
        mapCoordinates,
        14
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
