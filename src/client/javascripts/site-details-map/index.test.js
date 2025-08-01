import { SiteDetailsMap } from './index.js'

// Mock GeographicCoordinateConverter
jest.mock('./GeographicCoordinateConverter.js', () => ({
  default: {
    osgb36ToWgs84: jest.fn()
  }
}))

// Mock CircleGeometryCalculator
jest.mock('./CircleGeometryCalculator.js', () => ({
  default: {
    createGeographicCircle: jest.fn()
  }
}))

// Mock govuk-frontend Component
jest.mock('govuk-frontend', () => ({
  Component: class MockComponent {
    constructor($root) {
      this.$root = $root
    }
  }
}))

// Mock global objects
Object.defineProperty(globalThis, 'document', {
  value: {
    getElementById: jest.fn()
  },
  writable: true
})

Object.defineProperty(globalThis, 'setTimeout', {
  value: jest.fn((fn) => fn()),
  writable: true
})

describe('SiteDetailsMap', () => {
  let mockRoot
  let mockOpenLayersModules
  let siteDetailsMap

  // Helper functions to reduce code duplication
  const expectBasicMapInitialization = (siteDetailsMap, mockRoot) => {
    expect(siteDetailsMap.$root).toBe(mockRoot)
    expect(siteDetailsMap.map).toBeNull()
    expect(siteDetailsMap.vectorSource).toBeNull()
    expect(siteDetailsMap.vectorLayer).toBeNull()
    expect(siteDetailsMap.geoJSONFormat).toBeNull()
    expect(siteDetailsMap.olModules).toBeNull()
    expect(siteDetailsMap.destroyed).toBe(false)
  }

  const expectMapCleanup = (siteDetailsMap) => {
    expect(siteDetailsMap.destroyed).toBe(true)
    expect(siteDetailsMap.map).toBeNull()
    expect(siteDetailsMap.vectorSource).toBeNull()
    expect(siteDetailsMap.vectorLayer).toBeNull()
    expect(siteDetailsMap.geoJSONFormat).toBeNull()
    expect(siteDetailsMap.olModules).toBeNull()
  }

  const createSiteDetailsMapWithOptions = (options = {}) =>
    new SiteDetailsMap(mockRoot, options)

  beforeEach(() => {
    jest.clearAllMocks()

    mockRoot = {
      innerHTML: ''
    }

    mockOpenLayersModules = {
      OpenLayersMap: jest.fn(),
      View: jest.fn(),
      TileLayer: jest.fn(),
      OSM: jest.fn(),
      VectorLayer: jest.fn(),
      VectorSource: jest.fn(),
      Feature: jest.fn(),
      Point: jest.fn(),
      CircleGeom: jest.fn(),
      Polygon: jest.fn(),
      Style: jest.fn(),
      Fill: jest.fn(),
      Stroke: jest.fn(),
      Circle: jest.fn(),
      fromLonLat: jest.fn(),
      toLonLat: jest.fn(),
      GeoJSON: jest.fn()
    }
  })

  describe('constructor', () => {
    test.each([
      {
        description: 'default options',
        options: undefined,
        expectedCenter: [-3.5, 54.0],
        expectedZoom: 6
      },
      {
        description: 'custom options',
        options: { center: [1.0, 52.0], zoom: 8 },
        expectedCenter: [1.0, 52.0],
        expectedZoom: 8
      }
    ])(
      'should initialize with $description',
      ({ options, expectedCenter, expectedZoom }) => {
        siteDetailsMap = createSiteDetailsMapWithOptions(options)

        expectBasicMapInitialization(siteDetailsMap, mockRoot)
        expect(siteDetailsMap.options.center).toEqual(expectedCenter)
        expect(siteDetailsMap.options.zoom).toBe(expectedZoom)
      }
    )

    test('should call scheduleMapInitialization', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0)
    })
  })

  describe('scheduleMapInitialization', () => {
    test('should schedule map initialization', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.initializeMap = jest.fn().mockResolvedValue()

      siteDetailsMap.scheduleMapInitialization()

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0)
    })

    test('should handle initialization errors', async () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.initializeMap = jest
        .fn()
        .mockRejectedValue(new Error('Init failed'))
      siteDetailsMap.showError = jest.fn()

      // Call the method directly since setTimeout is mocked
      const timeoutCallback =
        setTimeout.mock.calls[setTimeout.mock.calls.length - 1][0]
      await timeoutCallback()

      expect(siteDetailsMap.showError).toHaveBeenCalled()
    })
  })

  describe('destroy', () => {
    test.each([
      {
        description: 'cleanup resources',
        setupMap: true,
        additionalChecks: (mockMap) => {
          expect(mockMap.setTarget).toHaveBeenCalledWith(null)
        }
      },
      {
        description: 'handle missing map gracefully',
        setupMap: false
      }
    ])('should $description', ({ setupMap, additionalChecks }) => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      let mockMap = null

      if (setupMap) {
        mockMap = { setTarget: jest.fn() }
        siteDetailsMap.map = mockMap
      }

      expect(() => siteDetailsMap.destroy()).not.toThrow()
      expectMapCleanup(siteDetailsMap)
      if (additionalChecks) {
        additionalChecks(mockMap)
      }
    })
  })

  describe('showError', () => {
    test('should display error message', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      siteDetailsMap.showError()

      expect(mockRoot.innerHTML).toBe(
        '<div class="app-site-details-map__error">Failed to load map. Please refresh the page.</div>'
      )
    })
  })

  describe('setupOpenLayersModules', () => {
    test('should store OpenLayers modules', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      siteDetailsMap.setupOpenLayersModules(mockOpenLayersModules)

      expect(siteDetailsMap.olModules).toBe(mockOpenLayersModules)
    })
  })

  describe('initializeGeoJSONFormat', () => {
    test('should create GeoJSON format instance', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      const MockGeoJSON = jest.fn()

      siteDetailsMap.initializeGeoJSONFormat(MockGeoJSON)

      expect(MockGeoJSON).toHaveBeenCalled()
      expect(siteDetailsMap.geoJSONFormat).toBeInstanceOf(MockGeoJSON)
    })
  })

  describe('createMapLayers', () => {
    test('should create vector source and layer', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.olModules = mockOpenLayersModules
      siteDetailsMap.createDefaultStyle = jest
        .fn()
        .mockReturnValue('mock-style')

      siteDetailsMap.createMapLayers()

      expect(mockOpenLayersModules.VectorSource).toHaveBeenCalled()
      expect(mockOpenLayersModules.VectorLayer).toHaveBeenCalledWith({
        source: siteDetailsMap.vectorSource,
        style: 'mock-style'
      })
    })
  })

  describe('loadSiteDetails', () => {
    test('should return early when no site data element exists', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      document.getElementById.mockReturnValue(null)

      siteDetailsMap.loadSiteDetails()

      expect(document.getElementById).toHaveBeenCalledWith('site-details-data')
    })

    test('should parse and display site details when element exists', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.displaySiteDetails = jest.fn()

      const mockElement = {
        textContent: JSON.stringify({ coordinatesType: 'coordinates' })
      }
      document.getElementById.mockReturnValue(mockElement)

      siteDetailsMap.loadSiteDetails()

      expect(siteDetailsMap.displaySiteDetails).toHaveBeenCalledWith({
        coordinatesType: 'coordinates'
      })
    })

    test('should handle JSON parsing errors', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.showError = jest.fn()

      const mockElement = {
        textContent: 'invalid json'
      }
      document.getElementById.mockReturnValue(mockElement)

      siteDetailsMap.loadSiteDetails()

      expect(siteDetailsMap.showError).toHaveBeenCalled()
    })
  })

  describe('displaySiteDetails', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.vectorSource = {
        clear: jest.fn()
      }
    })

    test('should clear vector source before displaying', () => {
      const siteDetails = { coordinatesType: 'file', geoJSON: {} }
      siteDetailsMap.displayFileUploadData = jest.fn()

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(siteDetailsMap.vectorSource.clear).toHaveBeenCalled()
    })

    test('should display file upload data for file coordinates', () => {
      const siteDetails = { coordinatesType: 'file', geoJSON: { features: [] } }
      siteDetailsMap.displayFileUploadData = jest.fn()

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(siteDetailsMap.displayFileUploadData).toHaveBeenCalledWith({
        features: []
      })
    })

    test('should display manual coordinates for coordinates type', () => {
      const siteDetails = { coordinatesType: 'coordinates' }
      siteDetailsMap.displayManualCoordinates = jest.fn()

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(siteDetailsMap.displayManualCoordinates).toHaveBeenCalledWith(
        siteDetails
      )
    })

    test('should show error for unknown coordinates type', () => {
      const siteDetails = { coordinatesType: 'unknown' }
      siteDetailsMap.showError = jest.fn()

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(siteDetailsMap.showError).toHaveBeenCalled()
    })
  })

  describe('displayFileUploadData', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.geoJSONFormat = {
        readFeatures: jest.fn()
      }
      siteDetailsMap.vectorSource = {
        addFeatures: jest.fn(),
        getExtent: jest.fn()
      }
      siteDetailsMap.map = {
        getView: jest.fn().mockReturnValue({
          fit: jest.fn()
        })
      }
    })

    test('should return early for invalid geoJSON', () => {
      siteDetailsMap.displayFileUploadData({})

      expect(siteDetailsMap.geoJSONFormat.readFeatures).not.toHaveBeenCalled()
    })

    test('should return early for geoJSON with non-array features', () => {
      siteDetailsMap.displayFileUploadData({ features: 'not-array' })

      expect(siteDetailsMap.geoJSONFormat.readFeatures).not.toHaveBeenCalled()
    })

    test('should process valid geoJSON features', () => {
      const geoJSON = { features: [{ geometry: {}, properties: {} }] }
      const mockFeatures = ['feature1', 'feature2']
      siteDetailsMap.geoJSONFormat.readFeatures.mockReturnValue(mockFeatures)

      siteDetailsMap.displayFileUploadData(geoJSON)

      expect(siteDetailsMap.geoJSONFormat.readFeatures).toHaveBeenCalledWith(
        geoJSON,
        {
          featureProjection: 'EPSG:3857'
        }
      )
      expect(siteDetailsMap.vectorSource.addFeatures).toHaveBeenCalledWith(
        mockFeatures
      )
    })

    test('should fit map view when features exist', () => {
      const geoJSON = { features: [{}] }
      const mockFeatures = ['feature1']
      const mockExtent = [0, 0, 100, 100]

      siteDetailsMap.geoJSONFormat.readFeatures.mockReturnValue(mockFeatures)
      siteDetailsMap.vectorSource.getExtent.mockReturnValue(mockExtent)

      siteDetailsMap.displayFileUploadData(geoJSON)

      expect(siteDetailsMap.map.getView().fit).toHaveBeenCalledWith(
        mockExtent,
        {
          padding: [20, 20, 20, 20],
          maxZoom: 16
        }
      )
    })
  })

  describe('coordinate system validation', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
    })

    describe('coordinate system recognition', () => {
      test.each([
        {
          method: 'isWGS84CoordinateSystem',
          validInputs: ['WGS84', 'wgs84'],
          invalidInputs: ['OSGB36', 'invalid']
        },
        {
          method: 'isOSGB36CoordinateSystem',
          validInputs: ['OSGB36', 'osgb36'],
          invalidInputs: ['WGS84', 'invalid']
        }
      ])(
        '$method should recognize coordinate systems',
        ({ method, validInputs, invalidInputs }) => {
          validInputs.forEach((input) => {
            expect(siteDetailsMap[method](input)).toBe(true)
          })
          invalidInputs.forEach((input) => {
            expect(siteDetailsMap[method](input)).toBe(false)
          })
        }
      )
    })

    describe('coordinate validation', () => {
      test.each([
        {
          method: 'hasWGS84Coordinates',
          validCoords: { latitude: '51.5', longitude: '-0.1' },
          invalidCoordsSets: [{ latitude: '51.5' }, { longitude: '-0.1' }, {}]
        },
        {
          method: 'hasOSGB36Coordinates',
          validCoords: { eastings: '530000', northings: '180000' },
          invalidCoordsSets: [
            { eastings: '530000' },
            { northings: '180000' },
            {}
          ]
        }
      ])(
        '$method should validate coordinates',
        ({ method, validCoords, invalidCoordsSets }) => {
          expect(siteDetailsMap[method](validCoords)).toBeTruthy()

          invalidCoordsSets.forEach((coords) => {
            expect(siteDetailsMap[method](coords)).toBeFalsy()
          })
        }
      )
    })
  })

  describe('coordinate conversion', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
    })

    describe('convertFromLonLat', () => {
      test('should convert longitude/latitude coordinates', () => {
        const mockFromLonLat = jest.fn().mockReturnValue([1000, 2000])
        const coordinates = { longitude: '-0.1', latitude: '51.5' }

        const result = siteDetailsMap.convertFromLonLat(
          coordinates,
          mockFromLonLat
        )

        expect(mockFromLonLat).toHaveBeenCalledWith([-0.1, 51.5])
        expect(result).toEqual([1000, 2000])
      })
    })
  })

  describe('parseCoordinates', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.convertFromLonLat = jest.fn().mockReturnValue([1000, 2000])
      siteDetailsMap.convertOSGB36ToWebMercator = jest
        .fn()
        .mockReturnValue([3000, 4000])
    })

    describe('successful coordinate parsing', () => {
      test.each([
        {
          description: 'parse WGS84 coordinates',
          coordinateSystem: 'WGS84',
          coordinates: { latitude: '51.5', longitude: '-0.1' },
          expectedResult: [1000, 2000],
          expectedMethod: 'convertFromLonLat',
          expectedArgs: [
            { latitude: '51.5', longitude: '-0.1' },
            expect.any(Function)
          ]
        },
        {
          description: 'parse OSGB36 coordinates',
          coordinateSystem: 'OSGB36',
          coordinates: { eastings: '530000', northings: '180000' },
          expectedResult: [3000, 4000],
          expectedMethod: 'convertOSGB36ToWebMercator',
          expectedArgs: [530000, 180000]
        }
      ])(
        'should $description',
        ({
          coordinateSystem,
          coordinates,
          expectedResult,
          expectedMethod,
          expectedArgs
        }) => {
          const mockFromLonLat = jest.fn()

          const result = siteDetailsMap.parseCoordinates(
            coordinateSystem,
            coordinates,
            mockFromLonLat
          )

          expect(result).toEqual(expectedResult)
          expect(siteDetailsMap[expectedMethod]).toHaveBeenCalledWith(
            ...expectedArgs
          )
        }
      )
    })

    describe('failed coordinate parsing', () => {
      test.each([
        {
          description: 'return null for invalid coordinate system',
          coordinateSystem: 'INVALID',
          coordinates: { latitude: '51.5', longitude: '-0.1' }
        },
        {
          description: 'return null for missing coordinates',
          coordinateSystem: 'WGS84',
          coordinates: { latitude: '51.5' }
        }
      ])('should $description', ({ coordinateSystem, coordinates }) => {
        const mockFromLonLat = jest.fn()

        const result = siteDetailsMap.parseCoordinates(
          coordinateSystem,
          coordinates,
          mockFromLonLat
        )

        expect(result).toBeNull()
      })
    })
  })

  describe('displayPointSite', () => {
    test('should create and add point feature', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.olModules = mockOpenLayersModules
      siteDetailsMap.vectorSource = {
        addFeature: jest.fn()
      }

      const mockFeature = {}
      const mockPoint = {}
      mockOpenLayersModules.Feature.mockReturnValue(mockFeature)
      mockOpenLayersModules.Point.mockReturnValue(mockPoint)

      const coordinates = [1000, 2000]
      siteDetailsMap.displayPointSite(coordinates)

      expect(mockOpenLayersModules.Point).toHaveBeenCalledWith(coordinates)
      expect(mockOpenLayersModules.Feature).toHaveBeenCalledWith({
        geometry: mockPoint
      })
      expect(siteDetailsMap.vectorSource.addFeature).toHaveBeenCalledWith(
        mockFeature
      )
    })
  })

  describe('displayCircularSite', () => {
    test('should create and add circular polygon feature', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.olModules = mockOpenLayersModules
      siteDetailsMap.vectorSource = {
        addFeature: jest.fn()
      }
      siteDetailsMap.createGeographicCircle = jest.fn().mockReturnValue([
        [0, 51],
        [0.1, 51],
        [0, 51]
      ])

      const mockFeature = {}
      const mockPolygon = {}
      mockOpenLayersModules.Feature.mockReturnValue(mockFeature)
      mockOpenLayersModules.Polygon.mockReturnValue(mockPolygon)
      mockOpenLayersModules.toLonLat.mockReturnValue([0, 51])
      mockOpenLayersModules.fromLonLat.mockImplementation((coord) =>
        coord.map((c) => c * 1000)
      )

      const centerCoordinates = [1000, 2000]
      const radiusInMeters = 500

      siteDetailsMap.displayCircularSite(centerCoordinates, radiusInMeters)

      expect(mockOpenLayersModules.toLonLat).toHaveBeenCalledWith(
        centerCoordinates
      )
      expect(siteDetailsMap.createGeographicCircle).toHaveBeenCalledWith(
        [0, 51],
        radiusInMeters
      )
      expect(siteDetailsMap.vectorSource.addFeature).toHaveBeenCalledWith(
        mockFeature
      )
    })
  })

  describe('displayManualCoordinates', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.olModules = mockOpenLayersModules
      siteDetailsMap.parseCoordinates = jest.fn()
      siteDetailsMap.displayPointSite = jest.fn()
      siteDetailsMap.displayCircularSite = jest.fn()
      siteDetailsMap.map = {
        getView: jest.fn().mockReturnValue({
          setCenter: jest.fn(),
          setZoom: jest.fn()
        })
      }
    })

    describe('early returns', () => {
      test('should return early when no coordinates provided', () => {
        const siteDetails = { coordinateSystem: 'WGS84' }

        siteDetailsMap.displayManualCoordinates(siteDetails)

        expect(siteDetailsMap.parseCoordinates).not.toHaveBeenCalled()
        expect(siteDetailsMap.displayPointSite).not.toHaveBeenCalled()
        expect(siteDetailsMap.displayCircularSite).not.toHaveBeenCalled()
      })

      test('should return early when coordinate parsing fails', () => {
        const siteDetails = {
          coordinateSystem: 'WGS84',
          coordinates: { latitude: '51.5', longitude: '-0.1' }
        }
        siteDetailsMap.parseCoordinates.mockReturnValue(null)

        siteDetailsMap.displayManualCoordinates(siteDetails)

        expect(siteDetailsMap.parseCoordinates).toHaveBeenCalled()
        expect(siteDetailsMap.displayPointSite).not.toHaveBeenCalled()
        expect(siteDetailsMap.displayCircularSite).not.toHaveBeenCalled()
      })
    })

    describe('successful displays', () => {
      test('should display circular site when circle width provided', () => {
        const siteDetails = {
          coordinateSystem: 'WGS84',
          coordinates: { latitude: '51.5', longitude: '-0.1' },
          circleWidth: 1000
        }
        const mapCoordinates = [1000, 2000]
        siteDetailsMap.parseCoordinates.mockReturnValue(mapCoordinates)

        siteDetailsMap.displayManualCoordinates(siteDetails)

        expect(siteDetailsMap.parseCoordinates).toHaveBeenCalled()
        expect(siteDetailsMap.displayCircularSite).toHaveBeenCalledWith(
          mapCoordinates,
          1000
        )
        expect(siteDetailsMap.map.getView().setCenter).toHaveBeenCalledWith(
          mapCoordinates
        )
        expect(siteDetailsMap.map.getView().setZoom).toHaveBeenCalledWith(14)
      })

      test('should display point site when no circle width provided', () => {
        const siteDetails = {
          coordinateSystem: 'WGS84',
          coordinates: { latitude: '51.5', longitude: '-0.1' }
        }
        const mapCoordinates = [1000, 2000]
        siteDetailsMap.parseCoordinates.mockReturnValue(mapCoordinates)

        siteDetailsMap.displayManualCoordinates(siteDetails)

        expect(siteDetailsMap.parseCoordinates).toHaveBeenCalled()
        expect(siteDetailsMap.displayPointSite).toHaveBeenCalledWith(
          mapCoordinates
        )
        expect(siteDetailsMap.map.getView().setCenter).toHaveBeenCalledWith(
          mapCoordinates
        )
        expect(siteDetailsMap.map.getView().setZoom).toHaveBeenCalledWith(14)
      })
    })
  })
})
