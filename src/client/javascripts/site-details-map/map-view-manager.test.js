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
        padding: [100, 100, 100, 100],
        maxZoom: 14,
        minZoom: 8
      })
    })

    test('should apply custom options when fitting map', () => {
      const extent = [100, 200, 300, 400]
      const customOptions = {
        padding: [10, 10, 10, 10],
        minResolution: 0.2,
        maxZoom: 14,
        minZoom: 8
      }

      mapViewManager.fitMapToExtent(mockMap, extent, customOptions)

      expect(mockView.fit).toHaveBeenCalledWith(extent, {
        padding: [10, 10, 10, 10],
        minResolution: 0.2,
        maxZoom: 14,
        minZoom: 8
      })
    })

    test('should fall back to centre view when extent has invalid coordinates', () => {
      const invalidExtent = [100, 200, Infinity, 400]

      mapViewManager.fitMapToExtent(mockMap, invalidExtent)

      expect(mockView.fit).not.toHaveBeenCalled()
      expect(mockView.setCenter).toHaveBeenCalledWith([-3.5, 54.0])
      expect(mockView.setZoom).toHaveBeenCalledWith(12)
    })

    test('should fall back to centre view when extent is null', () => {
      mapViewManager.fitMapToExtent(mockMap, null)

      expect(mockView.fit).not.toHaveBeenCalled()
      expect(mockView.setCenter).toHaveBeenCalledWith([-3.5, 54.0])
      expect(mockView.setZoom).toHaveBeenCalledWith(12)
    })

    test('should fall back to centre view when extent is undefined', () => {
      mapViewManager.fitMapToExtent(mockMap, undefined)

      expect(mockView.fit).not.toHaveBeenCalled()
      expect(mockView.setCenter).toHaveBeenCalledWith([-3.5, 54.0])
      expect(mockView.setZoom).toHaveBeenCalledWith(12)
    })

    test('should fall back to centre view when fit throws an error', () => {
      const extent = [100, 200, 300, 400]
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockView.fit.mockImplementation(() => {
        throw new Error('Fit failed')
      })

      mapViewManager.fitMapToExtent(mockMap, extent)

      expect(mockView.setCenter).toHaveBeenCalledWith([-3.5, 54.0])
      expect(mockView.setZoom).toHaveBeenCalledWith(12)

      consoleWarnSpy.mockRestore()
    })

    test('should log specific warning message when fit throws an error', () => {
      const extent = [100, 200, 300, 400]
      const testError = new Error('Fit failed')
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockView.fit.mockImplementation(() => {
        throw testError
      })

      mapViewManager.fitMapToExtent(mockMap, extent)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to fit map to extent, falling back to UK centre:',
        testError
      )

      consoleWarnSpy.mockRestore()
    })
  })

  const setupFitTest = (methodName, mockSourceFactory, extent, options) => {
    const mockSource = mockSourceFactory(extent)
    mapViewManager[methodName](mockMap, mockSource, options)
    return { mockSource, extent, options }
  }

  const getFitExpectations = (extent, options) => ({
    fitOptions: {
      padding: [100, 100, 100, 100],
      minZoom: 8,
      maxZoom: 14,
      ...options
    }
  })

  describe('fitMapToGeometry', () => {
    test('should get extent from geometry and call fitMapToExtent', () => {
      const extent = [100, 200, 300, 400]
      const options = { maxZoom: 15 }

      const { mockSource } = setupFitTest(
        'fitMapToGeometry',
        (extent) => ({ getExtent: jest.fn().mockReturnValue(extent) }),
        extent,
        options
      )

      const expectations = getFitExpectations(extent, options)
      expect(mockSource.getExtent).toHaveBeenCalled()
      expect(mockView.fit).toHaveBeenCalledWith(extent, expectations.fitOptions)
    })
  })

  describe('fitMapToAllFeatures', () => {
    test('should get extent from vector source and call fitMapToExtent', () => {
      const extent = [500, 600, 700, 800]
      const options = { minZoom: 10 }

      const { mockSource } = setupFitTest(
        'fitMapToAllFeatures',
        (extent) => ({ getExtent: jest.fn().mockReturnValue(extent) }),
        extent,
        options
      )

      const expectations = getFitExpectations(extent, options)
      expect(mockSource.getExtent).toHaveBeenCalled()
      expect(mockView.fit).toHaveBeenCalledWith(extent, expectations.fitOptions)
    })
  })

  describe('centreMapView', () => {
    test('should centre map on coordinates with default zoom', () => {
      const coordinates = [1000, 2000]

      mapViewManager.centreMapView(mockMap, coordinates)

      expect(mockView.setCenter).toHaveBeenCalledWith(coordinates)
      expect(mockView.setZoom).toHaveBeenCalledWith(12)
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
