import { vi } from 'vitest'
import SiteDataLoader from './site-data-loader.js'

Object.defineProperty(globalThis, 'document', {
  value: {
    getElementById: vi.fn(),
    createElement: vi.fn().mockImplementation((tagName) => {
      const element = {
        tagName: tagName.toUpperCase(),
        attributes: {},
        getAttribute: vi.fn().mockImplementation(function (name) {
          return this.attributes[name] || null
        }),
        setAttribute: vi.fn().mockImplementation(function (name, value) {
          this.attributes[name] = value
        })
      }
      return element
    })
  },
  writable: true
})

describe('SiteDataLoader', () => {
  let siteDataLoader
  let consoleErrorSpy

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    document.createElement.mockImplementation((tagName) => {
      const element = {
        tagName: tagName.toUpperCase(),
        attributes: {},
        getAttribute: vi.fn().mockImplementation(function (name) {
          return this.attributes[name] || null
        }),
        setAttribute: vi.fn().mockImplementation(function (name, value) {
          this.attributes[name] = value
        })
      }
      return element
    })
    siteDataLoader = new SiteDataLoader()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('loadSiteDetails', () => {
    test('should return null when element does not exist', () => {
      document.getElementById.mockReturnValue(null)

      const result = siteDataLoader.loadSiteDetails()

      expect(document.getElementById).toHaveBeenCalledWith('site-details-data')
      expect(result).toBeNull()
    })

    test('should parse and return site details when element exists', () => {
      const siteDetails = { coordinatesType: 'coordinates', coordinates: {} }
      const mockElement = {
        textContent: JSON.stringify(siteDetails)
      }
      document.getElementById.mockReturnValue(mockElement)

      const result = siteDataLoader.loadSiteDetails()

      expect(result).toEqual(siteDetails)
    })

    test('should log error and return null when JSON parsing fails', () => {
      const mockElement = {
        textContent: 'invalid json'
      }
      document.getElementById.mockReturnValue(mockElement)

      const result = siteDataLoader.loadSiteDetails()

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse site details from DOM:',
        expect.any(Error)
      )
    })

    test('should load data from map element data attribute when provided', () => {
      const siteDetails = { coordinatesType: 'coordinates', coordinates: {} }
      const mapElement = document.createElement('div')
      mapElement.setAttribute('data-site-details', JSON.stringify(siteDetails))

      siteDataLoader = new SiteDataLoader(mapElement)
      const result = siteDataLoader.loadSiteDetails()

      expect(result).toEqual(siteDetails)
      expect(document.getElementById).not.toHaveBeenCalled()
    })

    test('should fallback to global element when map element has no data', () => {
      const siteDetails = { coordinatesType: 'file', geoJSON: {} }
      const mapElement = document.createElement('div')
      // No data-site-details attribute set
      const mockElement = {
        textContent: JSON.stringify(siteDetails)
      }

      document.getElementById.mockReturnValue(mockElement)
      siteDataLoader = new SiteDataLoader(mapElement)

      const result = siteDataLoader.loadSiteDetails()

      expect(document.getElementById).toHaveBeenCalledWith('site-details-data')
      expect(result).toEqual(siteDetails)
    })

    test('should prioritize data attribute over global element', () => {
      const dataAttrSiteDetails = {
        coordinatesType: 'coordinates',
        source: 'data-attr'
      }
      const globalSiteDetails = { coordinatesType: 'file', source: 'global' }

      const mapElement = document.createElement('div')
      mapElement.setAttribute(
        'data-site-details',
        JSON.stringify(dataAttrSiteDetails)
      )
      const mockElement = {
        textContent: JSON.stringify(globalSiteDetails)
      }

      document.getElementById.mockReturnValue(mockElement)
      siteDataLoader = new SiteDataLoader(mapElement)

      const result = siteDataLoader.loadSiteDetails()

      expect(result).toEqual(dataAttrSiteDetails)
      expect(document.getElementById).not.toHaveBeenCalled()
    })
  })

  describe('hasValidFileCoordinates', () => {
    test('should return true for valid file coordinates', () => {
      const siteDetails = {
        coordinatesType: 'file',
        geoJSON: { features: [] }
      }

      const result = siteDataLoader.hasValidFileCoordinates(siteDetails)

      expect(result).toBe(true)
    })

    test('should return false when coordinatesType is not file', () => {
      const siteDetails = {
        coordinatesType: 'coordinates',
        geoJSON: { features: [] }
      }

      const result = siteDataLoader.hasValidFileCoordinates(siteDetails)

      expect(result).toBe(false)
    })

    test('should return false when geoJSON is null', () => {
      const siteDetails = {
        coordinatesType: 'file',
        geoJSON: null
      }

      const result = siteDataLoader.hasValidFileCoordinates(siteDetails)

      expect(result).toBe(false)
    })

    test('should return false when geoJSON is not an object', () => {
      const siteDetails = {
        coordinatesType: 'file',
        geoJSON: 'string'
      }

      const result = siteDataLoader.hasValidFileCoordinates(siteDetails)

      expect(result).toBe(false)
    })
  })

  describe('hasManualCoordinates', () => {
    test('should return true for manual coordinates', () => {
      const siteDetails = {
        coordinatesType: 'coordinates'
      }

      const result = siteDataLoader.hasManualCoordinates(siteDetails)

      expect(result).toBe(true)
    })

    test('should return false for non-manual coordinates', () => {
      const siteDetails = {
        coordinatesType: 'file'
      }

      const result = siteDataLoader.hasManualCoordinates(siteDetails)

      expect(result).toBe(false)
    })
  })

  describe('hasValidManualCoordinates', () => {
    test('should return true for valid manual coordinates', () => {
      const siteDetails = {
        coordinatesType: 'coordinates',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }

      const result = siteDataLoader.hasValidManualCoordinates(siteDetails)

      expect(result).toBe(true)
    })

    test('should return false when not manual coordinates', () => {
      const siteDetails = {
        coordinatesType: 'file',
        coordinates: { latitude: '51.5', longitude: '-0.1' }
      }

      const result = siteDataLoader.hasValidManualCoordinates(siteDetails)

      expect(result).toBe(false)
    })

    test('should return false when coordinates is missing', () => {
      const siteDetails = {
        coordinatesType: 'coordinates'
      }

      const result = siteDataLoader.hasValidManualCoordinates(siteDetails)

      expect(result).toBe(false)
    })
  })
})
