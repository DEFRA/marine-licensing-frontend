import CoordinateParser from './coordinate-parser.js'
import { SiteDetailsMap } from './index.js'
import MapFactory from './map-factory.js'
import OpenLayersModuleLoader from './openlayers-module-loader.js'
import SiteDataLoader from './site-data-loader.js'
import SiteVisualizer from './site-visualizer.js'

// Mock document for DOM operations
Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: jest.fn().mockReturnValue({
      innerHTML: ''
    })
  },
  writable: true
})

// Mock govuk-frontend Component to avoid browser compatibility checks
jest.mock('govuk-frontend', () => ({
  Component: class MockComponent {
    constructor($root) {
      this.$root = $root
    }
  }
}))

jest.mock('./coordinate-parser.js')
jest.mock('./openlayers-module-loader.js')
jest.mock('./site-data-loader.js')
jest.mock('./map-factory.js')
jest.mock('./site-visualizer.js')

// Mock setTimeout to control execution for testing
const mockSetTimeout = jest.fn()
globalThis.setTimeout = mockSetTimeout

describe('SiteDetailsMap', () => {
  let mockRoot
  let siteDetailsMap
  let mockDataLoader
  let mockSiteVisualizer
  let mockCoordinateParser
  let mockModuleLoader

  beforeEach(() => {
    jest.clearAllMocks()
    mockSetTimeout.mockClear()

    mockRoot = document.createElement('div')
    mockRoot.innerHTML = ''

    // Set up service mocks
    mockDataLoader = {
      loadSiteDetails: jest.fn(),
      hasValidFileCoordinates: jest.fn(),
      hasValidManualCoordinates: jest.fn()
    }

    mockSiteVisualizer = {
      clearFeatures: jest.fn(),
      displayFileUploadData: jest.fn(),
      centreMapView: jest.fn(),
      displayCircularSite: jest.fn(),
      displayPointSite: jest.fn(),
      olModules: {
        fromLonLat: jest.fn()
      }
    }

    mockCoordinateParser = {
      parseCoordinates: jest.fn()
    }

    mockModuleLoader = {
      loadModules: jest.fn().mockResolvedValue({
        OpenLayersMap: jest.fn(),
        View: jest.fn(),
        TileLayer: jest.fn(),
        OSM: jest.fn(),
        VectorLayer: jest.fn(),
        VectorSource: jest.fn(),
        Feature: jest.fn(),
        Point: jest.fn(),
        Polygon: jest.fn(),
        Style: jest.fn(),
        Fill: jest.fn(),
        Stroke: jest.fn(),
        Circle: jest.fn(),
        fromLonLat: jest.fn(),
        toLonLat: jest.fn(),
        GeoJSON: jest.fn(),
        Attribution: jest.fn(),
        defaultControls: jest.fn()
      })
    }

    SiteDataLoader.mockImplementation(() => mockDataLoader)
    SiteVisualizer.mockImplementation(() => mockSiteVisualizer)
    CoordinateParser.mockImplementation(() => mockCoordinateParser)
    MapFactory.mockImplementation(() => ({
      createMapLayers: jest.fn().mockReturnValue({
        vectorSource: {},
        vectorLayer: {}
      }),
      initializeGeoJSONFormat: jest.fn().mockReturnValue({}),
      createMap: jest.fn().mockReturnValue({})
    }))
    OpenLayersModuleLoader.mockImplementation(() => mockModuleLoader)
  })

  describe('constructor', () => {
    test('should initialize with default options', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      expect(siteDetailsMap.options.center).toEqual([-3.5, 54.0])
      expect(siteDetailsMap.options.zoom).toBe(6)
      expect(siteDetailsMap.map).toBeNull()
      expect(siteDetailsMap.destroyed).toBe(false)
    })

    test('should merge custom options with defaults', () => {
      const customOptions = { zoom: 10, center: [0, 51] }

      siteDetailsMap = new SiteDetailsMap(mockRoot, customOptions)

      expect(siteDetailsMap.options.zoom).toBe(10)
      expect(siteDetailsMap.options.center).toEqual([0, 51])
    })

    test('should initialize service dependencies', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      expect(CoordinateParser).toHaveBeenCalled()
      expect(SiteDataLoader).toHaveBeenCalled()
      expect(OpenLayersModuleLoader).toHaveBeenCalled()
    })

    test('should use default module loader when none provided', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      expect(siteDetailsMap.moduleLoader).toBeDefined()
      expect(OpenLayersModuleLoader).toHaveBeenCalled()
    })

    test('should accept injected module loader', () => {
      const customModuleLoader = { loadModules: jest.fn() }

      siteDetailsMap = new SiteDetailsMap(mockRoot, {}, customModuleLoader)

      expect(siteDetailsMap.moduleLoader).toBe(customModuleLoader)
      expect(OpenLayersModuleLoader).not.toHaveBeenCalled()
    })
  })

  describe('displaySiteDetails coordination', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.siteVisualizer = mockSiteVisualizer
    })

    test('should clear features before displaying new data', () => {
      const siteDetails = { geoJSON: { features: [] } }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(true)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(mockSiteVisualizer.clearFeatures).toHaveBeenCalled()
    })

    test('should display file upload data when file coordinates are valid', () => {
      const siteDetails = { geoJSON: { features: [] } }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(true)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(mockSiteVisualizer.displayFileUploadData).toHaveBeenCalledWith(
        siteDetails.geoJSON
      )
    })

    test('should return file type when file coordinates are displayed', () => {
      const siteDetails = { geoJSON: { features: [] } }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(true)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      const result = siteDetailsMap.displaySiteDetails(siteDetails)

      expect(result).toBe('file')
    })

    test('should validate file coordinates using data loader', () => {
      const siteDetails = { geoJSON: { features: [] } }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(true)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(mockDataLoader.hasValidFileCoordinates).toHaveBeenCalledWith(
        siteDetails
      )
    })

    test('should display manual coordinates when valid manual coordinates exist', () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(false)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(true)
      mockCoordinateParser.parseCoordinates.mockReturnValue([1000, 2000])

      const result = siteDetailsMap.displaySiteDetails(siteDetails)

      expect(result).toBe('manual')
      expect(mockSiteVisualizer.clearFeatures).toHaveBeenCalled()
      expect(mockDataLoader.hasValidManualCoordinates).toHaveBeenCalledWith(
        siteDetails
      )
    })

    test('should show error when no valid coordinates exist', () => {
      const siteDetails = {}
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(false)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      const showErrorSpy = jest.spyOn(siteDetailsMap, 'showError')

      const result = siteDetailsMap.displaySiteDetails(siteDetails)

      expect(result).toBe('error')
      expect(mockSiteVisualizer.clearFeatures).toHaveBeenCalled()
      expect(showErrorSpy).toHaveBeenCalled()
    })

    test('should return early if siteVisualizer is not available', () => {
      siteDetailsMap.siteVisualizer = null
      const siteDetails = {}

      const result = siteDetailsMap.displaySiteDetails(siteDetails)

      expect(result).toBeNull()
      expect(mockDataLoader.hasValidFileCoordinates).not.toHaveBeenCalled()
      expect(mockDataLoader.hasValidManualCoordinates).not.toHaveBeenCalled()
    })
  })

  describe('displayManualCoordinates', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.siteVisualizer = mockSiteVisualizer
    })

    test('should render point geometry when no circle width provided', () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      const mapCoordinates = [1000, 2000]
      mockCoordinateParser.parseCoordinates.mockReturnValue(mapCoordinates)

      siteDetailsMap.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).toHaveBeenCalledWith(
        'WGS84',
        siteDetails.coordinates,
        mockSiteVisualizer.olModules.fromLonLat
      )
      expect(mockSiteVisualizer.displayPointSite).toHaveBeenCalledWith(
        mapCoordinates
      )
      expect(mockSiteVisualizer.centreMapView).toHaveBeenCalledWith(
        mapCoordinates,
        14
      )
    })

    test('should render circular geometry when circle width provided', () => {
      const siteDetails = {
        coordinateSystem: 'OSGB36',
        coordinates: { eastings: '530000', northings: '180000' },
        circleWidth: 500
      }
      const mapCoordinates = [3000, 4000]
      mockCoordinateParser.parseCoordinates.mockReturnValue(mapCoordinates)

      siteDetailsMap.displayManualCoordinates(siteDetails)

      expect(mockSiteVisualizer.displayCircularSite).toHaveBeenCalledWith(
        mapCoordinates,
        500
      )
      expect(mockSiteVisualizer.centreMapView).toHaveBeenCalledWith(
        mapCoordinates,
        14
      )
    })

    test('should return early when coordinates are missing', () => {
      const siteDetails = { coordinateSystem: 'WGS84' }

      siteDetailsMap.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).not.toHaveBeenCalled()
      expect(mockSiteVisualizer.displayPointSite).not.toHaveBeenCalled()
    })

    test('should return early when fromLonLat function is not available', () => {
      const siteDetails = {
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      siteDetailsMap.siteVisualizer = { ...mockSiteVisualizer, olModules: null }

      siteDetailsMap.displayManualCoordinates(siteDetails)

      expect(mockCoordinateParser.parseCoordinates).not.toHaveBeenCalled()
    })

    test('should return early when coordinate parsing fails', () => {
      const siteDetails = {
        coordinateSystem: 'INVALID',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }
      mockCoordinateParser.parseCoordinates.mockReturnValue(null)

      siteDetailsMap.displayManualCoordinates(siteDetails)

      expect(mockSiteVisualizer.displayPointSite).not.toHaveBeenCalled()
      expect(mockSiteVisualizer.centreMapView).not.toHaveBeenCalled()
    })
  })

  describe('loadAndDisplaySiteDetails', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.siteVisualizer = mockSiteVisualizer
    })

    test('should load and display site details when data exists', () => {
      const siteDetails = { coordinateSystem: 'WGS84' }
      mockDataLoader.loadSiteDetails.mockReturnValue(siteDetails)
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(false)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      const displaySpy = jest.spyOn(siteDetailsMap, 'displaySiteDetails')

      siteDetailsMap.loadAndDisplaySiteDetails()

      expect(mockDataLoader.loadSiteDetails).toHaveBeenCalled()
      expect(displaySpy).toHaveBeenCalledWith(siteDetails)
    })

    test('should return early when no site details exist', () => {
      mockDataLoader.loadSiteDetails.mockReturnValue(null)

      const displaySpy = jest.spyOn(siteDetailsMap, 'displaySiteDetails')

      siteDetailsMap.loadAndDisplaySiteDetails()

      expect(mockDataLoader.loadSiteDetails).toHaveBeenCalled()
      expect(displaySpy).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    test('should display error message in root element', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      siteDetailsMap.showError()

      expect(mockRoot.innerHTML).toContain('Failed to load map')
      expect(mockRoot.innerHTML).toContain('app-site-details-map__error')
      expect(mockRoot.innerHTML).toContain('Please refresh the page')
    })
  })

  describe('destroy', () => {
    test('should set destroyed flag and clean up references', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      const mockMap = { setTarget: jest.fn() }
      siteDetailsMap.map = mockMap
      siteDetailsMap.mapFactory = {}
      siteDetailsMap.siteVisualizer = {}

      siteDetailsMap.destroy()

      expect(siteDetailsMap.destroyed).toBe(true)
      expect(mockMap.setTarget).toHaveBeenCalledWith(null)
      expect(siteDetailsMap.map).toBeNull()
      expect(siteDetailsMap.mapFactory).toBeNull()
      expect(siteDetailsMap.siteVisualizer).toBeNull()
    })

    test('should handle destroy when map is not set', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.map = null

      expect(() => {
        siteDetailsMap.destroy()
      }).not.toThrow()

      expect(siteDetailsMap.destroyed).toBe(true)
    })
  })

  describe('getFromLonLatFunction', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
    })

    test('should return fromLonLat function when available', () => {
      const mockFromLonLat = jest.fn()
      siteDetailsMap.siteVisualizer = {
        olModules: { fromLonLat: mockFromLonLat }
      }

      const result = siteDetailsMap.getFromLonLatFunction()

      expect(result).toBe(mockFromLonLat)
    })

    test('should return null when siteVisualizer is not available', () => {
      siteDetailsMap.siteVisualizer = null

      const result = siteDetailsMap.getFromLonLatFunction()

      expect(result).toBeNull()
    })

    test('should return null when olModules is not available', () => {
      siteDetailsMap.siteVisualizer = { olModules: null }

      const result = siteDetailsMap.getFromLonLatFunction()

      expect(result).toBeNull()
    })
  })

  describe('scheduleMapInitialization', () => {
    test('should call setTimeout with initialization function', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      jest.spyOn(siteDetailsMap, 'initializeMap').mockResolvedValue()

      siteDetailsMap.scheduleMapInitialization()

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 0)
    })

    test('should handle initializeMap errors', async () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      const showErrorSpy = jest.spyOn(siteDetailsMap, 'showError')
      jest
        .spyOn(siteDetailsMap, 'initializeMap')
        .mockRejectedValue(new Error('Init failed'))

      // Get the callback function passed to setTimeout
      siteDetailsMap.scheduleMapInitialization()
      const [callback] = mockSetTimeout.mock.calls[0]

      await callback()

      expect(showErrorSpy).toHaveBeenCalled()
    })
  })

  describe('renderSiteGeometry', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.siteVisualizer = mockSiteVisualizer
    })

    test('should render circular site when circleWidth provided', () => {
      const mapCoordinates = [1000, 2000]
      const circleWidth = 500

      const result = siteDetailsMap.renderSiteGeometry(
        mapCoordinates,
        circleWidth
      )

      expect(result).toBe('circle')
      expect(mockSiteVisualizer.displayCircularSite).toHaveBeenCalledWith(
        mapCoordinates,
        circleWidth
      )
    })

    test('should render point site when no circleWidth provided', () => {
      const mapCoordinates = [1000, 2000]

      const result = siteDetailsMap.renderSiteGeometry(mapCoordinates)

      expect(result).toBe('point')
      expect(mockSiteVisualizer.displayPointSite).toHaveBeenCalledWith(
        mapCoordinates
      )
    })

    test('should return null when no siteVisualizer available', () => {
      siteDetailsMap.siteVisualizer = null
      const mapCoordinates = [1000, 2000]

      const result = siteDetailsMap.renderSiteGeometry(mapCoordinates)

      expect(result).toBeNull()
      expect(mockSiteVisualizer.displayCircularSite).not.toHaveBeenCalled()
      expect(mockSiteVisualizer.displayPointSite).not.toHaveBeenCalled()
    })
  })

  describe('centreMapOnCoordinates', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.siteVisualizer = mockSiteVisualizer
    })

    test('should centre map when siteVisualizer available', () => {
      const mapCoordinates = [1000, 2000]

      const result = siteDetailsMap.centreMapOnCoordinates(mapCoordinates)

      expect(result).toBe(true)
      expect(mockSiteVisualizer.centreMapView).toHaveBeenCalledWith(
        mapCoordinates,
        14
      )
    })

    test('should return false when no siteVisualizer available', () => {
      siteDetailsMap.siteVisualizer = null
      const mapCoordinates = [1000, 2000]

      const result = siteDetailsMap.centreMapOnCoordinates(mapCoordinates)

      expect(result).toBe(false)
      expect(mockSiteVisualizer.centreMapView).not.toHaveBeenCalled()
    })
  })

  describe('initializeMap with dependency injection', () => {
    test('should use injected module loader to load OpenLayers modules', async () => {
      const customModuleLoader = {
        loadModules: jest.fn().mockResolvedValue({
          OpenLayersMap: jest.fn(),
          View: jest.fn(),
          TileLayer: jest.fn(),
          OSM: jest.fn(),
          VectorLayer: jest.fn(),
          VectorSource: jest.fn(),
          Feature: jest.fn(),
          Point: jest.fn(),
          Polygon: jest.fn(),
          Style: jest.fn(),
          Fill: jest.fn(),
          Stroke: jest.fn(),
          Circle: jest.fn(),
          fromLonLat: jest.fn(),
          toLonLat: jest.fn(),
          GeoJSON: jest.fn(),
          Attribution: jest.fn(),
          defaultControls: jest.fn()
        })
      }

      siteDetailsMap = new SiteDetailsMap(mockRoot, {}, customModuleLoader)

      await siteDetailsMap.initializeMap()

      expect(customModuleLoader.loadModules).toHaveBeenCalled()
      expect(MapFactory).toHaveBeenCalledWith(
        expect.objectContaining({
          OpenLayersMap: expect.any(Function),
          View: expect.any(Function)
        })
      )
    })

    test('should handle module loading errors gracefully', async () => {
      const failingModuleLoader = {
        loadModules: jest
          .fn()
          .mockRejectedValue(new Error('Module loading failed'))
      }

      siteDetailsMap = new SiteDetailsMap(mockRoot, {}, failingModuleLoader)

      await expect(siteDetailsMap.initializeMap()).rejects.toThrow(
        'Module loading failed'
      )
      expect(failingModuleLoader.loadModules).toHaveBeenCalled()
    })

    test('should return early when component is destroyed during initialization', async () => {
      const moduleLoader = {
        loadModules: jest.fn().mockResolvedValue({
          OpenLayersMap: jest.fn(),
          View: jest.fn(),
          TileLayer: jest.fn(),
          OSM: jest.fn(),
          VectorLayer: jest.fn(),
          VectorSource: jest.fn(),
          Feature: jest.fn(),
          Point: jest.fn(),
          Polygon: jest.fn(),
          Style: jest.fn(),
          Fill: jest.fn(),
          Stroke: jest.fn(),
          Circle: jest.fn(),
          fromLonLat: jest.fn(),
          toLonLat: jest.fn(),
          GeoJSON: jest.fn(),
          Attribution: jest.fn(),
          defaultControls: jest.fn()
        })
      }

      siteDetailsMap = new SiteDetailsMap(mockRoot, {}, moduleLoader)
      siteDetailsMap.destroyed = true

      await siteDetailsMap.initializeMap()

      expect(moduleLoader.loadModules).toHaveBeenCalled()
      expect(MapFactory).not.toHaveBeenCalled()
    })
  })
})
