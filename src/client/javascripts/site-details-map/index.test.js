// @vitest-environment jsdom
import { vi } from 'vitest'
import { SiteDetailsMap } from './index.js'
import MapFactory from './map-factory.js'
import OpenLayersModuleLoader from './openlayers-module-loader.js'
import SiteDataLoader from './site-data-loader.js'
import SiteVisualiser from './site-visualiser.js'

vi.mock('govuk-frontend', () => ({
  Component: class MockComponent {
    constructor($root) {
      this.$root = $root
    }
  }
}))

vi.mock('./openlayers-module-loader.js')
vi.mock('./site-data-loader.js')
vi.mock('./map-factory.js')
vi.mock('./site-visualiser.js')

const mockSetTimeout = vi.fn()
globalThis.setTimeout = mockSetTimeout

describe('SiteDetailsMap', () => {
  let mockRoot
  let siteDetailsMap
  let mockDataLoader
  let mockSiteVisualiser
  let mockModuleLoader

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
    mockSetTimeout.mockClear()

    mockRoot = document.createElement('div')
    mockRoot.innerHTML = ''

    mockDataLoader = {
      loadSiteDetails: vi.fn(),
      hasValidFileCoordinates: vi.fn(),
      hasValidManualCoordinates: vi.fn()
    }

    mockSiteVisualiser = {
      clearFeatures: vi.fn(),
      displayFileUploadData: vi.fn(),
      centreMapView: vi.fn(),
      displayCircularSite: vi.fn(),
      displayPointSite: vi.fn(),
      displayManualCoordinates: vi.fn(),
      olModules: {
        fromLonLat: vi.fn()
      }
    }

    mockModuleLoader = {
      loadModules: vi.fn().mockResolvedValue({
        OpenLayersMap: vi.fn(function () {}),
        View: vi.fn(function () {}),
        TileLayer: vi.fn(function () {}),
        OSM: vi.fn(function () {}),
        VectorLayer: vi.fn(function () {}),
        VectorSource: vi.fn(function () {}),
        Feature: vi.fn(function () {}),
        Point: vi.fn(function () {}),
        Polygon: vi.fn(function () {}),
        Style: vi.fn(function () {}),
        Fill: vi.fn(function () {}),
        Stroke: vi.fn(function () {}),
        Circle: vi.fn(function () {}),
        fromLonLat: vi.fn(),
        toLonLat: vi.fn(),
        GeoJSON: vi.fn(function () {}),
        Attribution: vi.fn(function () {}),
        defaultControls: vi.fn()
      })
    }

    SiteDataLoader.mockImplementation(function () {
      return mockDataLoader
    })
    SiteVisualiser.mockImplementation(function () {
      return mockSiteVisualiser
    })
    MapFactory.mockImplementation(function () {
      return {
        createMapLayers: vi.fn().mockReturnValue({
          vectorSource: {},
          vectorLayer: {}
        }),
        initialiseGeoJSONFormat: vi.fn().mockReturnValue({}),
        createMap: vi.fn().mockReturnValue({})
      }
    })
    OpenLayersModuleLoader.mockImplementation(function () {
      return mockModuleLoader
    })
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

      expect(SiteDataLoader).toHaveBeenCalledWith(mockRoot)
      expect(OpenLayersModuleLoader).toHaveBeenCalled()
    })

    test('should use default module loader when none provided', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      expect(siteDetailsMap.moduleLoader).toBeDefined()
      expect(OpenLayersModuleLoader).toHaveBeenCalled()
    })

    test('should accept injected module loader', () => {
      const customModuleLoader = { loadModules: vi.fn() }

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

    test('should add an error class when no valid coordinates exist', () => {
      const siteDetails = {}
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(false)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      const result = siteDetailsMap.displaySiteDetails(siteDetails)

      expect(result).toBe('error')
      expect(mockSiteVisualiser.clearFeatures).toHaveBeenCalled()
      expect(mockRoot.classList.contains('site-details-map--error')).toEqual(
        true
      )
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
    test('should add an error class to the root element', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      siteDetailsMap.showError()

      expect(mockRoot.classList.contains('site-details-map--error')).toEqual(
        true
      )
    })
  })

  describe('scheduleMapInitialisation', () => {
    test('should call setTimeout with initialisation function', () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      vi.spyOn(siteDetailsMap, 'initialiseMap').mockResolvedValue()

      siteDetailsMap.scheduleMapInitialisation()

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 0)
    })

    test('should handle initialiseMap errors', async () => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      const showErrorSpy = vi.spyOn(siteDetailsMap, 'showError')
      vi.spyOn(siteDetailsMap, 'initialiseMap').mockRejectedValue(
        new Error('Init failed')
      )

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
        loadModules: vi.fn().mockResolvedValue({
          OpenLayersMap: vi.fn(function () {}),
          View: vi.fn(function () {}),
          TileLayer: vi.fn(function () {}),
          OSM: vi.fn(function () {}),
          VectorLayer: vi.fn(function () {}),
          VectorSource: vi.fn(function () {}),
          Feature: vi.fn(function () {}),
          Point: vi.fn(function () {}),
          Polygon: vi.fn(function () {}),
          Style: vi.fn(function () {}),
          Fill: vi.fn(function () {}),
          Stroke: vi.fn(function () {}),
          Circle: vi.fn(function () {}),
          fromLonLat: vi.fn(),
          toLonLat: vi.fn(),
          GeoJSON: vi.fn(function () {}),
          Attribution: vi.fn(function () {}),
          defaultControls: vi.fn()
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
        loadModules: vi
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
      const errorSpy = vi.spyOn(siteDetailsMap, 'showError')
      const hasValidSiteDetailsSpy = vi.spyOn(
        siteDetailsMap,
        'hasValidSiteDetails'
      )

      await siteDetailsMap.initialiseMap()

      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(mockDataLoader.loadSiteDetails).toHaveBeenCalled()
      expect(hasValidSiteDetailsSpy).not.toHaveBeenCalled()
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
      const errorSpy = vi.spyOn(siteDetailsMap, 'showError')

      await siteDetailsMap.initialiseMap()

      expect(errorSpy).toHaveBeenCalled()
      expect(mockDataLoader.loadSiteDetails).toHaveBeenCalled()
      expect(mockModuleLoader.loadModules).not.toHaveBeenCalled()
      expect(siteDetailsMap.map).toBeNull()
      expect(siteDetailsMap.siteVisualiser).toBeNull()
    })

    test('should handle null site details with proper early return', async () => {
      mockDataLoader.loadSiteDetails.mockReturnValue(null)
      siteDetailsMap = new SiteDetailsMap(mockRoot)

      const showErrorSpy = vi
        .spyOn(siteDetailsMap, 'showError')
        .mockImplementation()
      const hasValidSpy = vi
        .spyOn(siteDetailsMap, 'hasValidSiteDetails')
        .mockImplementation()

      await siteDetailsMap.initialiseMap()

      expect(showErrorSpy).toHaveBeenCalledTimes(1)
      expect(hasValidSpy).not.toHaveBeenCalled()
      expect(mockModuleLoader.loadModules).not.toHaveBeenCalled()
    })
  })

  describe('multiple map instances', () => {
    test('should handle multiple maps with different root elements', () => {
      const mockRoot1 = {
        dataset: { siteDetails: '{"coordinatesType":"coordinates"}' }
      }
      const mockRoot2 = {
        dataset: { siteDetails: '{"coordinatesType":"file"}' }
      }

      const siteDetailsMap1 = new SiteDetailsMap(mockRoot1)
      const siteDetailsMap2 = new SiteDetailsMap(mockRoot2)

      expect(siteDetailsMap1).toBeInstanceOf(SiteDetailsMap)
      expect(siteDetailsMap2).toBeInstanceOf(SiteDetailsMap)
      expect(siteDetailsMap1).not.toBe(siteDetailsMap2)
      expect(siteDetailsMap1.dataLoader).toBeDefined()
      expect(siteDetailsMap2.dataLoader).toBeDefined()
    })

    test('should handle maps with no data gracefully', () => {
      const mockRoot = { dataset: {} }

      const siteDetailsMap = new SiteDetailsMap(mockRoot)

      expect(siteDetailsMap).toBeInstanceOf(SiteDetailsMap)
      expect(siteDetailsMap.dataLoader).toBeDefined()
    })
  })
})
