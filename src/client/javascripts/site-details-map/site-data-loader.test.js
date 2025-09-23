import SiteDataLoader from './site-data-loader.js'

Object.defineProperty(globalThis, 'document', {
  value: {
    getElementById: jest.fn()
  },
  writable: true
})

describe('SiteDataLoader', () => {
  let siteDataLoader

  beforeEach(() => {
    jest.clearAllMocks()
    siteDataLoader = new SiteDataLoader()
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

    test('should handle invalid JSON gracefully and return null', () => {
      const mockElement = {
        textContent: 'invalid json'
      }
      document.getElementById.mockReturnValue(mockElement)

      const result = siteDataLoader.loadSiteDetails()

      expect(result).toBeNull()
    })

    test('should load data from map element data attribute when provided', () => {
      const siteDetails = { coordinatesType: 'coordinates', coordinates: {} }
      const mockMapElement = {
        getAttribute: jest.fn().mockReturnValue(JSON.stringify(siteDetails))
      }

      siteDataLoader = new SiteDataLoader(mockMapElement)
      const result = siteDataLoader.loadSiteDetails()

      expect(mockMapElement.getAttribute).toHaveBeenCalledWith(
        'data-site-details'
      )
      expect(result).toEqual(siteDetails)
      expect(document.getElementById).not.toHaveBeenCalled()
    })

    test('should fallback to global element when map element has no data', () => {
      const siteDetails = { coordinatesType: 'file', geoJSON: {} }
      const mockMapElement = {
        getAttribute: jest.fn().mockReturnValue(null)
      }
      const mockElement = {
        textContent: JSON.stringify(siteDetails)
      }

      document.getElementById.mockReturnValue(mockElement)
      siteDataLoader = new SiteDataLoader(mockMapElement)

      const result = siteDataLoader.loadSiteDetails()

      expect(mockMapElement.getAttribute).toHaveBeenCalledWith(
        'data-site-details'
      )
      expect(document.getElementById).toHaveBeenCalledWith('site-details-data')
      expect(result).toEqual(siteDetails)
    })

    test('should handle invalid JSON in data attribute gracefully', () => {
      const mockMapElement = {
        getAttribute: jest.fn().mockReturnValue('invalid json')
      }

      document.getElementById.mockReturnValue(null)
      siteDataLoader = new SiteDataLoader(mockMapElement)

      const result = siteDataLoader.loadSiteDetails()
      expect(result).toBeNull()
    })

    test('should prioritize data attribute over global element', () => {
      const dataAttrSiteDetails = {
        coordinatesType: 'coordinates',
        source: 'data-attr'
      }
      const globalSiteDetails = { coordinatesType: 'file', source: 'global' }

      const mockMapElement = {
        getAttribute: jest
          .fn()
          .mockReturnValue(JSON.stringify(dataAttrSiteDetails))
      }
      const mockElement = {
        textContent: JSON.stringify(globalSiteDetails)
      }

      document.getElementById.mockReturnValue(mockElement)
      siteDataLoader = new SiteDataLoader(mockMapElement)

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
