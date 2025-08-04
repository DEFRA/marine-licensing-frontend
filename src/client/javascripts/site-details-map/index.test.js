import CoordinateParser from './CoordinateParser.js'
import { SiteDetailsMap } from './index.js'
import MapFactory from './MapFactory.js'
import SiteDataLoader from './SiteDataLoader.js'
import SiteVisualizer from './SiteVisualizer.js'

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

jest.mock('./CoordinateParser.js')
jest.mock('./SiteDataLoader.js')
jest.mock('./MapFactory.js')
jest.mock('./SiteVisualizer.js')

// Mock setTimeout to execute synchronously for testing
globalThis.setTimeout = jest.fn((fn) => fn())

describe('SiteDetailsMap', () => {
  let mockRoot
  let siteDetailsMap
  let mockDataLoader
  let mockSiteVisualizer
  let mockCoordinateParser

  beforeEach(() => {
    jest.clearAllMocks()

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
      centerMapView: jest.fn(),
      displayCircularSite: jest.fn(),
      displayPointSite: jest.fn(),
      olModules: {
        fromLonLat: jest.fn()
      }
    }

    mockCoordinateParser = {
      parseCoordinates: jest.fn()
    }

    SiteDataLoader.mockImplementation(() => mockDataLoader)
    SiteVisualizer.mockImplementation(() => mockSiteVisualizer)
    CoordinateParser.mockImplementation(() => mockCoordinateParser)
    MapFactory.mockImplementation(() => ({}))
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
    })
  })

  describe('displaySiteDetails coordination', () => {
    beforeEach(() => {
      siteDetailsMap = new SiteDetailsMap(mockRoot)
      siteDetailsMap.siteVisualizer = mockSiteVisualizer
    })

    test('should display file data when valid file coordinates exist', () => {
      const siteDetails = { geoJSON: { features: [] } }
      mockDataLoader.hasValidFileCoordinates.mockReturnValue(true)
      mockDataLoader.hasValidManualCoordinates.mockReturnValue(false)

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(mockSiteVisualizer.clearFeatures).toHaveBeenCalled()
      expect(mockSiteVisualizer.displayFileUploadData).toHaveBeenCalledWith(
        siteDetails.geoJSON
      )
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

      siteDetailsMap.displaySiteDetails(siteDetails)

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

      siteDetailsMap.displaySiteDetails(siteDetails)

      expect(mockSiteVisualizer.clearFeatures).toHaveBeenCalled()
      expect(showErrorSpy).toHaveBeenCalled()
    })

    test('should return early if siteVisualizer is not available', () => {
      siteDetailsMap.siteVisualizer = null
      const siteDetails = {}

      siteDetailsMap.displaySiteDetails(siteDetails)

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
      expect(mockSiteVisualizer.centerMapView).toHaveBeenCalledWith(
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
      expect(mockSiteVisualizer.centerMapView).toHaveBeenCalledWith(
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
      expect(mockSiteVisualizer.centerMapView).not.toHaveBeenCalled()
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
})
