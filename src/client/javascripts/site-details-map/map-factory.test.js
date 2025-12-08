import { vi } from 'vitest'
import MapFactory from './map-factory.js'

Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: vi.fn().mockReturnValue({})
  },
  writable: true
})

describe('MapFactory', () => {
  let mapFactory
  let mockOlModules

  beforeEach(() => {
    mockOlModules = {
      OpenLayersMap: vi.fn(function () {}),
      View: vi.fn(function () {}),
      TileLayer: vi.fn(function () {}),
      OSM: vi.fn(function () {}),
      VectorLayer: vi.fn(function () {}),
      VectorSource: vi.fn(function () {}),
      Style: vi.fn(function () {}),
      Fill: vi.fn(function () {}),
      Stroke: vi.fn(function () {}),
      Circle: vi.fn(function () {}),
      GeoJSON: vi.fn(function () {}),

      Attribution: vi.fn(function () {}),
      defaultControls: vi.fn().mockReturnValue({
        extend: vi.fn().mockReturnValue([])
      }),
      ScaleLine: vi.fn(function () {})
    }

    mapFactory = new MapFactory(mockOlModules)
  })

  const createMapTestSetup = () => ({
    target: document.createElement('div'),
    options: { center: [-3.5, 54.0], zoom: 6 },
    vectorLayer: {},
    mocks: {
      tileLayer: {},
      osm: {},
      view: {},
      attribution: {},
      scaleLine: {},
      map: {}
    }
  })

  const setupMapMocks = (setup) => {
    mockOlModules.TileLayer.mockImplementation(function () {
      return setup.mocks.tileLayer
    })
    mockOlModules.OSM.mockImplementation(function () {
      return setup.mocks.osm
    })
    mockOlModules.View.mockImplementation(function () {
      return setup.mocks.view
    })
    mockOlModules.Attribution.mockImplementation(function () {
      return setup.mocks.attribution
    })
    mockOlModules.ScaleLine.mockImplementation(function () {
      return setup.mocks.scaleLine
    })
    mockOlModules.OpenLayersMap.mockImplementation(function () {
      return setup.mocks.map
    })
  }

  describe('createMap', () => {
    test('should create tile layer with OSM source', () => {
      const setup = createMapTestSetup()
      setupMapMocks(setup)

      mapFactory.createMap(setup.target, setup.options, setup.vectorLayer)

      expect(mockOlModules.TileLayer).toHaveBeenCalledWith({
        source: setup.mocks.osm
      })
      expect(mockOlModules.OSM).toHaveBeenCalled()
    })

    test('should configure attribution without collapsible button', () => {
      const setup = createMapTestSetup()
      setupMapMocks(setup)

      mapFactory.createMap(setup.target, setup.options, setup.vectorLayer)

      expect(mockOlModules.Attribution).toHaveBeenCalledWith({
        collapsible: false,
        collapsed: false
      })
    })

    test('should setup controls with custom attribution and scale line', () => {
      const setup = createMapTestSetup()
      setupMapMocks(setup)

      mapFactory.createMap(setup.target, setup.options, setup.vectorLayer)

      expect(mockOlModules.defaultControls).toHaveBeenCalledWith({
        attribution: false
      })
      expect(mockOlModules.defaultControls().extend).toHaveBeenCalledWith([
        setup.mocks.attribution,
        setup.mocks.scaleLine
      ])
    })

    test('should configure scale line with metric units', () => {
      const setup = createMapTestSetup()
      setupMapMocks(setup)

      mapFactory.createMap(setup.target, setup.options, setup.vectorLayer)

      expect(mockOlModules.ScaleLine).toHaveBeenCalledWith({
        units: 'metric'
      })
    })

    test('should create view with provided options', () => {
      const setup = createMapTestSetup()
      setupMapMocks(setup)

      mapFactory.createMap(setup.target, setup.options, setup.vectorLayer)

      expect(mockOlModules.View).toHaveBeenCalledWith({
        center: setup.options.center,
        zoom: setup.options.zoom
      })
    })

    test('should create map with all components', () => {
      const setup = createMapTestSetup()
      setupMapMocks(setup)

      mapFactory.createMap(setup.target, setup.options, setup.vectorLayer)

      expect(mockOlModules.OpenLayersMap).toHaveBeenCalledWith({
        target: setup.target,
        layers: [setup.mocks.tileLayer, setup.vectorLayer],
        controls: [],
        view: setup.mocks.view
      })
    })

    test('should return created map instance', () => {
      const setup = createMapTestSetup()
      setupMapMocks(setup)

      const result = mapFactory.createMap(
        setup.target,
        setup.options,
        setup.vectorLayer
      )

      expect(result).toBe(setup.mocks.map)
    })
  })

  describe('createMapLayers', () => {
    test('should create vector source and layer', () => {
      const mockVectorSource = {}
      const mockVectorLayer = {}
      const mockStyle = {}

      mockOlModules.VectorSource.mockImplementation(function () {
        return mockVectorSource
      })
      mockOlModules.VectorLayer.mockImplementation(function () {
        return mockVectorLayer
      })
      mapFactory.createDefaultStyle = vi.fn().mockReturnValue(mockStyle)

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

      mockOlModules.Style.mockImplementation(function () {
        return mockStyle
      })
      mockOlModules.Fill.mockImplementation(function () {
        return mockFill
      })
      mockOlModules.Stroke.mockImplementation(function () {
        return mockStroke
      })
      mockOlModules.Circle.mockImplementation(function () {
        return mockCircle
      })

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
      mockOlModules.Stroke.mockImplementation(function () {
        return mockStroke
      })

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
      mockOlModules.Fill.mockImplementation(function () {
        return mockFill
      })

      mapFactory.createDefaultStyle()

      expect(mockOlModules.Fill).toHaveBeenCalledWith({
        color: 'rgba(255, 255, 255, 0.2)'
      })
      expect(mockOlModules.Fill).toHaveBeenCalledWith({
        color: 'transparent'
      })
      expect(mockOlModules.Fill).not.toHaveBeenCalledWith({})
      expect(mockOlModules.Fill).not.toHaveBeenCalledWith({
        color: ''
      })
    })

    test('should create circle image style with geometry property', () => {
      const mockCircle = {}
      const mockFill = {}
      const mockStroke = {}

      mockOlModules.Circle.mockImplementation(function () {
        return mockCircle
      })
      mockOlModules.Fill.mockImplementation(function () {
        return mockFill
      })
      mockOlModules.Stroke.mockImplementation(function () {
        return mockStroke
      })

      mapFactory.createDefaultStyle()

      expect(mockOlModules.Circle).toHaveBeenCalledWith({
        radius: 7,
        fill: mockFill,
        stroke: mockStroke
      })
      expect(mockOlModules.Circle).not.toHaveBeenCalledWith({})
    })
  })

  describe('initialiseGeoJSONFormat', () => {
    test('should create GeoJSON format instance', () => {
      const mockInstance = {}
      mockOlModules.GeoJSON.mockImplementation(function () {
        return mockInstance
      })

      const result = mapFactory.initialiseGeoJSONFormat()

      expect(mockOlModules.GeoJSON).toHaveBeenCalled()
      expect(result).toBe(mockInstance)
    })
  })

  describe('setupResponsiveAttribution', () => {
    const createMocks = (mapSize = [800, 600]) => ({
      mockMap: {
        on: vi.fn(),
        getSize: vi.fn().mockReturnValue(mapSize)
      },
      mockAttribution: {
        setCollapsible: vi.fn(),
        setCollapsed: vi.fn()
      }
    })

    test('should set up event listener and check size on initialisation', () => {
      const { mockMap, mockAttribution } = createMocks()

      mapFactory.setupResponsiveAttribution(mockMap, mockAttribution)

      expect(mockMap.on).toHaveBeenCalledWith(
        'change:size',
        expect.any(Function)
      )
      expect(mockMap.getSize).toHaveBeenCalled()
      expect(mockAttribution.setCollapsible).toHaveBeenCalledWith(false)
      expect(mockAttribution.setCollapsed).toHaveBeenCalledWith(false)
    })

    test('should collapse attribution for small maps', () => {
      const { mockMap, mockAttribution } = createMocks([400, 300])

      mapFactory.setupResponsiveAttribution(mockMap, mockAttribution)

      expect(mockAttribution.setCollapsible).toHaveBeenCalledWith(true)
      expect(mockAttribution.setCollapsed).toHaveBeenCalledWith(true)
    })

    test('should not collapse attribution for map exactly at boundary size', () => {
      const { mockMap, mockAttribution } = createMocks([600, 600])

      mapFactory.setupResponsiveAttribution(mockMap, mockAttribution)

      expect(mockAttribution.setCollapsible).toHaveBeenCalledWith(false)
      expect(mockAttribution.setCollapsed).toHaveBeenCalledWith(false)
    })

    test('should call checkSize function when map size changes', () => {
      const { mockMap, mockAttribution } = createMocks()

      mapFactory.setupResponsiveAttribution(mockMap, mockAttribution)

      const [, callback] = mockMap.on.mock.calls[0]
      mockAttribution.setCollapsible.mockClear()
      mockAttribution.setCollapsed.mockClear()
      mockMap.getSize.mockReturnValue([500, 400])

      callback()

      expect(mockAttribution.setCollapsible).toHaveBeenCalledWith(true)
      expect(mockAttribution.setCollapsed).toHaveBeenCalledWith(true)
    })
  })
})
