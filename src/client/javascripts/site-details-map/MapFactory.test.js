import MapFactory from './MapFactory.js'

Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: jest.fn().mockReturnValue({})
  },
  writable: true
})

describe('MapFactory', () => {
  let mapFactory
  let mockOlModules

  beforeEach(() => {
    mockOlModules = {
      OpenLayersMap: jest.fn(),
      View: jest.fn(),
      TileLayer: jest.fn(),
      OSM: jest.fn(),
      VectorLayer: jest.fn(),
      VectorSource: jest.fn(),
      Style: jest.fn(),
      Fill: jest.fn(),
      Stroke: jest.fn(),
      Circle: jest.fn(),

      Attribution: jest.fn(),
      defaultControls: jest.fn().mockReturnValue({
        extend: jest.fn().mockReturnValue([])
      })
    }

    mapFactory = new MapFactory(mockOlModules)
  })

  describe('createMap', () => {
    test('should create map with correct configuration', () => {
      const mockTarget = document.createElement('div')
      const options = { center: [-3.5, 54.0], zoom: 6 }
      const mockVectorLayer = {}
      const mockTileLayer = {}
      const mockOSM = {}
      const mockView = {}
      const mockAttribution = {}
      const mockMap = {}

      mockOlModules.TileLayer.mockReturnValue(mockTileLayer)
      mockOlModules.OSM.mockReturnValue(mockOSM)
      mockOlModules.View.mockReturnValue(mockView)

      mockOlModules.Attribution.mockReturnValue(mockAttribution)
      mockOlModules.OpenLayersMap.mockReturnValue(mockMap)

      const result = mapFactory.createMap(mockTarget, options, mockVectorLayer)

      expect(mockOlModules.TileLayer).toHaveBeenCalledWith({
        source: mockOSM
      })
      expect(mockOlModules.OSM).toHaveBeenCalled()
      expect(mockOlModules.Attribution).toHaveBeenCalledWith({
        collapsible: false,
        collapsed: false
      })
      expect(mockOlModules.defaultControls).toHaveBeenCalledWith({
        attribution: false
      })
      expect(mockOlModules.defaultControls().extend).toHaveBeenCalledWith([
        mockAttribution
      ])
      expect(mockOlModules.View).toHaveBeenCalledWith({
        center: options.center,
        zoom: options.zoom
      })
      expect(mockOlModules.OpenLayersMap).toHaveBeenCalledWith({
        target: mockTarget,
        layers: [mockTileLayer, mockVectorLayer],
        controls: [],
        view: mockView
      })
      expect(result).toBe(mockMap)
    })
  })

  describe('createMapLayers', () => {
    test('should create vector source and layer', () => {
      const mockVectorSource = {}
      const mockVectorLayer = {}
      const mockStyle = {}

      mockOlModules.VectorSource.mockReturnValue(mockVectorSource)
      mockOlModules.VectorLayer.mockReturnValue(mockVectorLayer)
      mapFactory.createDefaultStyle = jest.fn().mockReturnValue(mockStyle)

      const result = mapFactory.createMapLayers()

      expect(mockOlModules.VectorSource).toHaveBeenCalled()
      expect(mockOlModules.VectorLayer).toHaveBeenCalledWith({
        source: mockVectorSource,
        style: mockStyle
      })
      expect(result).toEqual({
        vectorSource: mockVectorSource,
        vectorLayer: mockVectorLayer
      })
    })
  })

  describe('createDefaultStyle', () => {
    test('should create default style with correct properties', () => {
      const mockStyle = {}
      const mockFill = {}
      const mockStroke = {}
      const mockCircle = {}

      mockOlModules.Style.mockReturnValue(mockStyle)
      mockOlModules.Fill.mockReturnValue(mockFill)
      mockOlModules.Stroke.mockReturnValue(mockStroke)
      mockOlModules.Circle.mockReturnValue(mockCircle)

      const result = mapFactory.createDefaultStyle()

      expect(mockOlModules.Fill).toHaveBeenCalledWith({
        color: 'rgba(255, 255, 255, 0.2)'
      })
      expect(mockOlModules.Stroke).toHaveBeenCalledWith({
        color: '#000000',
        width: 2
      })
      expect(mockOlModules.Circle).toHaveBeenCalledWith({
        radius: 7,
        fill: mockFill,
        stroke: mockStroke
      })
      expect(mockOlModules.Style).toHaveBeenCalledWith({
        fill: mockFill,
        stroke: mockStroke,
        image: mockCircle
      })
      expect(result).toBe(mockStyle)
    })

    test('should create stroke style with correct properties', () => {
      const mockStroke = {}
      mockOlModules.Stroke.mockReturnValue(mockStroke)

      mapFactory.createDefaultStyle()

      expect(mockOlModules.Stroke).toHaveBeenCalledWith({
        color: '#000000',
        width: 2
      })
      expect(mockOlModules.Stroke).not.toHaveBeenCalledWith({})
      expect(mockOlModules.Stroke).not.toHaveBeenCalledWith({
        color: '',
        width: 2
      })
    })

    test('should create fill styles with correct colors', () => {
      const mockFill = {}
      mockOlModules.Fill.mockReturnValue(mockFill)

      mapFactory.createDefaultStyle()

      // Main fill
      expect(mockOlModules.Fill).toHaveBeenCalledWith({
        color: 'rgba(255, 255, 255, 0.2)'
      })
      // Circle fill (transparent)
      expect(mockOlModules.Fill).toHaveBeenCalledWith({
        color: 'transparent'
      })
      // Should not be called with empty objects or empty strings
      expect(mockOlModules.Fill).not.toHaveBeenCalledWith({})
      expect(mockOlModules.Fill).not.toHaveBeenCalledWith({
        color: ''
      })
    })

    test('should create circle image style with geometry property', () => {
      const mockCircle = {}
      const mockFill = {}
      const mockStroke = {}

      mockOlModules.Circle.mockReturnValue(mockCircle)
      mockOlModules.Fill.mockReturnValue(mockFill)
      mockOlModules.Stroke.mockReturnValue(mockStroke)

      mapFactory.createDefaultStyle()

      expect(mockOlModules.Circle).toHaveBeenCalledWith({
        radius: 7,
        fill: mockFill,
        stroke: mockStroke
      })
      expect(mockOlModules.Circle).not.toHaveBeenCalledWith({})
    })
  })

  describe('initializeGeoJSONFormat', () => {
    test('should create GeoJSON format instance', () => {
      const MockGeoJSON = jest.fn()
      const mockInstance = {}
      MockGeoJSON.mockReturnValue(mockInstance)

      const result = mapFactory.initializeGeoJSONFormat(MockGeoJSON)

      expect(MockGeoJSON).toHaveBeenCalled()
      expect(result).toBe(mockInstance)
    })
  })
})
