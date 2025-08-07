import { SiteDetailsMap } from './index.js'
import MapFactory from './map-factory.js'
import OpenLayersModuleLoader from './openlayers-module-loader.js'
import SiteDataLoader from './site-data-loader.js'
import SiteVisualiser from './site-visualiser.js'

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

jest.mock('./openlayers-module-loader.js')
jest.mock('./site-data-loader.js')
jest.mock('./map-factory.js')
jest.mock('./site-visualiser.js')

// Mock setTimeout to control execution for testing
const mockSetTimeout = jest.fn()
globalThis.setTimeout = mockSetTimeout

describe('SiteDetailsMap', () => {
  let mockRoot
  let siteDetailsMap
  let mockDataLoader
  let mockSiteVisualiser
  let mockModuleLoader

  // Helper functions to reduce test duplication
  const setupFileCoordinatesTest = (
    siteDetails = { geoJSON: { features: [] } }
  ) => {
    mockDataLoader.hasValidFileCoordinates.mockReturnValue(true)
    mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)
    return siteDetails
  }

  const setupManualCoordinatesTest = (
    siteDetails = {
      coordinateSystem: 'WGS84',
      coordinates: { latitude: '51.5', longitude: '-0.1' }
    }
  ) => {
    mockDataLoader.hasValidFileCoordinates.mockReturnValue(false)
    mockDataLoader.hasValidManualCoordinates.mockReturnValue(true)
    return siteDetails
  }

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

    mockSiteVisualiser = {
      clearFeatures: jest.fn(),
      displayFileUploadData: jest.fn(),
      centreMapView: jest.fn(),
      displayCircularSite: jest.fn(),
      displayPointSite: jest.fn(),
      displayManualCoordinates: jest.fn(),
      olModules: {
        fromLonLat: jest.fn()
      }
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
    SiteVisualiser.mockImplementation(() => mockSiteVisualiser)
    MapFactory.mockImplementation(() => ({
      createMapLayers: jest.fn().mockReturnValue({
        vectorSource: {},
        vectorLayer: {}
      }),
      initialiseGeoJSONFormat: jest.fn().mockReturnValue({}),
      createMap: jest.fn().mockReturnValue({})
    }))
    OpenLayersModuleLoader.mockImplementation(() => mockModuleLoader)
  })

  describe('constructor', () => {
    test('should initialise with default options', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      expect(siteDetailsMap.options.center).toEqual([-3.5, 54.0])
      expect(siteDetailsMap.options.zoom).toBe(6)
      expect(siteDetailsMap.map).toBeNull()
    })

    test('should merge custom options with defaults', () => {
      const customOptions = { zoom: 10, center: [0, 51] }

      siteDetailsMap = new SiteDetailsMap(mockRoot, customOptions)

      expect(siteDetailsMap.options.zoom).toBe(10)
      expect(siteDetailsMap.options.center).toEqual([0, 51])
    })

    test('should initialise service dependencies', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

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
      siteDetailsMap.siteVisualiser = mockSiteVisualiser
    })

    test('should clear features before displaying new data', () => {
      const siteDetails = { geoJSON: { features: [] } }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(true)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(mockSiteVisualiser.clearFeatures).toHaveBeenCalled()
    })

    test('should display file upload data when file coordinates are valid', () => {
      const siteDetails = { geoJSON: { features: [] } }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(true)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(mockSiteVisualiser.displayFileUploadData).toHaveBeenCalledWith(
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
      const siteDetails = setupFileCoordinatesTest()

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(mockDataLoader.hasValidFileCoordinates).toHaveBeenCalledWith(
        siteDetails
      )
    })

    test('should display manual coordinates when valid manual coordinates exist', () => {
      const siteDetails = setupManualCoordinatesTest()

      const result = siteDetailsMap.displaySiteDetails(siteDetails)

      expect(result).toBe('manual')
      expect(mockSiteVisualiser.clearFeatures).toHaveBeenCalled()
      expect(mockDataLoader.hasValidManualCoordinates).toHaveBeenCalledWith(
        siteDetails
      )
      expect(mockSiteVisualiser.displayManualCoordinates).toHaveBeenCalledWith(
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
      expect(mockSiteVisualiser.clearFeatures).toHaveBeenCalled()
      expect(showErrorSpy).toHaveBeenCalled()
    })

    test('should return early if siteVisualiser is not available', () => {
      siteDetailsMap.siteVisualiser = null
      const siteDetails = {}

      const result = siteDetailsMap.displaySiteDetails(siteDetails)

      expect(result).toBeNull()
      expect(mockDataLoader.hasValidFileCoordinates).not.toHaveBeenCalled()
      expect(mockDataLoader.hasValidManualCoordinates).not.toHaveBeenCalled()
    })
  })

  describe('hasValidSiteDetails', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
    })

    test('should return true when file coordinates are valid', () => {
      const siteDetails = setupFileCoordinatesTest({
        coordinateSystem: 'WGS84',
        coordinatesType: 'file'
      })

      const result = siteDetailsMap.hasValidSiteDetails(siteDetails)

      expect(result).toBe(true)
      expect(mockDataLoader.hasValidFileCoordinates).toHaveBeenCalledWith(
        siteDetails
      )
    })

    test('should return true when manual coordinates are valid', () => {
      const siteDetails = setupManualCoordinatesTest({
        coordinateSystem: 'WGS84',
        coordinatesType: 'coordinates'
      })

      const result = siteDetailsMap.hasValidSiteDetails(siteDetails)

      expect(result).toBe(true)
      expect(mockDataLoader.hasValidManualCoordinates).toHaveBeenCalledWith(
        siteDetails
      )
    })

    test('should return false when no valid coordinates exist', () => {
      const siteDetails = { coordinateSystem: 'WGS84' }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(false)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      const result = siteDetailsMap.hasValidSiteDetails(siteDetails)

      expect(result).toBe(false)
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

  describe('scheduleMapInitialisation', () => {
    test('should call setTimeout with initialisation function', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      jest.spyOn(siteDetailsMap, 'initialiseMap').mockResolvedValue()

      siteDetailsMap.scheduleMapInitialisation()

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 0)
    })

    test('should handle initialiseMap errors', async () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      const showErrorSpy = jest.spyOn(siteDetailsMap, 'showError')
      jest
        .spyOn(siteDetailsMap, 'initialiseMap')
        .mockRejectedValue(new Error('Init failed'))

      // Get the callback function passed to setTimeout
      siteDetailsMap.scheduleMapInitialisation()
      const [callback] = mockSetTimeout.mock.calls[0]

      await callback()

      expect(showErrorSpy).toHaveBeenCalled()
    })
  })

  describe('initialiseMap with dependency injection', () => {
    const setupValidSiteDetailsData = () => {
      const siteDetails = {
        coordinateSystem: 'WGS84',
        coordinatesType: 'coordinates'
      }
      mockDataLoader.loadSiteDetails.mockReturnValue(siteDetails)
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(false)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(true)
      return siteDetails
    }

    test('should use injected module loader to load OpenLayers modules', async () => {
      setupValidSiteDetailsData()

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

      await siteDetailsMap.initialiseMap()

      expect(customModuleLoader.loadModules).toHaveBeenCalled()
      expect(MapFactory).toHaveBeenCalledWith(
        expect.objectContaining({
          OpenLayersMap: expect.any(Function),
          View: expect.any(Function)
        })
      )
    })

    test('should handle module loading errors gracefully', async () => {
      setupValidSiteDetailsData()

      const failingModuleLoader = {
        loadModules: jest
          .fn()
          .mockRejectedValue(new Error('Module loading failed'))
      }

      siteDetailsMap = new SiteDetailsMap(mockRoot, {}, failingModuleLoader)

      await expect(siteDetailsMap.initialiseMap()).rejects.toThrow(
        'Module loading failed'
      )
      expect(failingModuleLoader.loadModules).toHaveBeenCalled()
    })

    test('should show error when no site details exist', async () => {
      mockDataLoader.loadSiteDetails.mockReturnValue(null)
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      const errorSpy = jest.spyOn(siteDetailsMap, 'showError')
      const hasValidSiteDetailsSpy = jest.spyOn(
        siteDetailsMap,
        'hasValidSiteDetails'
      )

      await siteDetailsMap.initialiseMap()

      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(mockDataLoader.loadSiteDetails).toHaveBeenCalled()
      // The method should return early, never reaching hasValidSiteDetails
      expect(hasValidSiteDetailsSpy).not.toHaveBeenCalled()
      // Ensure execution stops and no further processing occurs
      expect(mockModuleLoader.loadModules).not.toHaveBeenCalled()
      expect(siteDetailsMap.map).toBeNull()
      expect(siteDetailsMap.siteVisualiser).toBeNull()
    })

    test('should show error when site details are invalid', async () => {
      const invalidSiteDetails = { coordinateSystem: 'WGS84' }
      mockDataLoader.loadSiteDetails.mockReturnValue(invalidSiteDetails)
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(false)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      siteDetailsMap = new SiteDetailsMap(mockRoot)
      const errorSpy = jest.spyOn(siteDetailsMap, 'showError')

      await siteDetailsMap.initialiseMap()

      expect(errorSpy).toHaveBeenCalled()
      expect(mockDataLoader.loadSiteDetails).toHaveBeenCalled()
      // Ensure execution stops and no further processing occurs
      expect(mockModuleLoader.loadModules).not.toHaveBeenCalled()
      expect(siteDetailsMap.map).toBeNull()
      expect(siteDetailsMap.siteVisualiser).toBeNull()
    })

    test('should handle null site details with proper early return', async () => {
      // Test to specifically catch mutation where condition is bypassed
      mockDataLoader.loadSiteDetails.mockReturnValue(null)
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      // Mock all subsequent methods to detect if they're called inappropriately
      const showErrorSpy = jest
        .spyOn(siteDetailsMap, 'showError')
        .mockImplementation()
      const hasValidSpy = jest
        .spyOn(siteDetailsMap, 'hasValidSiteDetails')
        .mockImplementation()

      await siteDetailsMap.initialiseMap()

      // When siteDetails is null, showError MUST be called and hasValidSiteDetails must NOT be called
      expect(showErrorSpy).toHaveBeenCalledTimes(1)
      expect(hasValidSpy).not.toHaveBeenCalled()
      expect(mockModuleLoader.loadModules).not.toHaveBeenCalled()
    })
  })
})
