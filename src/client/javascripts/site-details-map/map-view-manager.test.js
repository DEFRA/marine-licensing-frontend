import MapViewManager from './map-view-manager.js'

describe('MapViewManager', () => {
  let mapViewManager
  let mockMap
  let mockView

  beforeEach(() => {
    jest.clearAllMocks()

    mockView = {
      fit: jest.fn(),
      setCenter: jest.fn(),
      setZoom: jest.fn()
    }

    mockMap = {
      getView: jest.fn().mockReturnValue(mockView)
    }

    mapViewManager = new MapViewManager()
  })

  describe('fitMapToExtent', () => {
    test('should fit map view to valid extent with default options', () => {
      const extent = [100, 200, 300, 400]

      mapViewManager.fitMapToExtent(mockMap, extent)

      expect(mockView.fit).toHaveBeenCalledWith(extent, {
        padding: [20, 20, 20, 20],
        maxZoom: 16,
        minZoom: 8,
        duration: 500
      })
    })

    test('should apply custom options when fitting map', () => {
      const extent = [100, 200, 300, 400]
      const customOptions = {
        padding: [10, 10, 10, 10],
        maxZoom: 18,
        minZoom: 5
      }

      mapViewManager.fitMapToExtent(mockMap, extent, customOptions)

      expect(mockView.fit).toHaveBeenCalledWith(extent, {
        padding: [10, 10, 10, 10],
        maxZoom: 18,
        minZoom: 5,
        duration: 500
      })
    })

    test('should fall back to centre view when extent has invalid coordinates', () => {
      const invalidExtent = [100, 200, Infinity, 400]

      mapViewManager.fitMapToExtent(mockMap, invalidExtent)

      expect(mockView.fit).not.toHaveBeenCalled()
      expect(mockView.setCenter).toHaveBeenCalledWith([-3.5, 54.0])
      expect(mockView.setZoom).toHaveBeenCalledWith(14)
    })

    test('should fall back to centre view when extent is null', () => {
      mapViewManager.fitMapToExtent(mockMap, null)

      expect(mockView.fit).not.toHaveBeenCalled()
      expect(mockView.setCenter).toHaveBeenCalledWith([-3.5, 54.0])
      expect(mockView.setZoom).toHaveBeenCalledWith(14)
    })

    test('should fall back to centre view when fit throws an error', () => {
      const extent = [100, 200, 300, 400]
      mockView.fit.mockImplementation(() => {
        throw new Error('Fit failed')
      })

      mapViewManager.fitMapToExtent(mockMap, extent)

      expect(mockView.setCenter).toHaveBeenCalledWith([-3.5, 54.0])
      expect(mockView.setZoom).toHaveBeenCalledWith(14)
    })
  })

  describe('fitMapToGeometry', () => {
    test('should get extent from geometry and call fitMapToExtent', () => {
      const mockGeometry = {
        getExtent: jest.fn().mockReturnValue([100, 200, 300, 400])
      }
      const options = { maxZoom: 15 }

      mapViewManager.fitMapToGeometry(mockMap, mockGeometry, options)

      expect(mockGeometry.getExtent).toHaveBeenCalled()
      expect(mockView.fit).toHaveBeenCalledWith([100, 200, 300, 400], {
        padding: [20, 20, 20, 20],
        maxZoom: 15,
        minZoom: 8,
        duration: 500
      })
    })
  })

  describe('fitMapToAllFeatures', () => {
    test('should get extent from vector source and call fitMapToExtent', () => {
      const mockVectorSource = {
        getExtent: jest.fn().mockReturnValue([500, 600, 700, 800])
      }
      const options = { minZoom: 10 }

      mapViewManager.fitMapToAllFeatures(mockMap, mockVectorSource, options)

      expect(mockVectorSource.getExtent).toHaveBeenCalled()
      expect(mockView.fit).toHaveBeenCalledWith([500, 600, 700, 800], {
        padding: [20, 20, 20, 20],
        maxZoom: 16,
        minZoom: 10,
        duration: 500
      })
    })
  })

  describe('centreMapView', () => {
    test('should centre map on coordinates with default zoom', () => {
      const coordinates = [1000, 2000]

      mapViewManager.centreMapView(mockMap, coordinates)

      expect(mockView.setCenter).toHaveBeenCalledWith(coordinates)
      expect(mockView.setZoom).toHaveBeenCalledWith(14)
    })

    test('should centre map on coordinates with custom zoom', () => {
      const coordinates = [1000, 2000]
      const zoomLevel = 12

      mapViewManager.centreMapView(mockMap, coordinates, zoomLevel)

      expect(mockView.setCenter).toHaveBeenCalledWith(coordinates)
      expect(mockView.setZoom).toHaveBeenCalledWith(zoomLevel)
    })
  })
})
