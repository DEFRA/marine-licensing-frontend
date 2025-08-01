import { Component } from 'govuk-frontend'

import CircleGeometryCalculator from './CircleGeometryCalculator.js'
import GeographicCoordinateConverter from './GeographicCoordinateConverter.js'

const DEFAULT_UK_CENTER_LONGITUDE = -3.5
const DEFAULT_UK_CENTER_LATITUDE = 54.0
const DEFAULT_MAP_ZOOM = 6
const DETAILED_ZOOM_LEVEL = 14
const MAX_ZOOM_LEVEL = 16

const CIRCLE_APPROXIMATION_SIDES = 64

const MAP_PADDING_PIXELS = 20
const STROKE_WIDTH_PIXELS = 2

export class SiteDetailsMap extends Component {
  static moduleName = 'site-details-map'

  constructor($root, options = {}) {
    super($root)

    this.options = {
      center: [DEFAULT_UK_CENTER_LONGITUDE, DEFAULT_UK_CENTER_LATITUDE],
      zoom: DEFAULT_MAP_ZOOM,
      ...options
    }

    this.map = null
    this.vectorSource = null
    this.vectorLayer = null
    this.geoJSONFormat = null
    this.olModules = null
    this.destroyed = false

    this.scheduleMapInitialization()
  }

  scheduleMapInitialization() {
    setTimeout(() => {
      this.initializeMap().catch(() => {
        this.showError()
      })
    }, 0)
  }

  async initializeMap() {
    try {
      await this.loadOpenLayersModules()
      if (this.destroyed) {
        return
      }
      this.createMapLayers()
      this.createMap()
      this.loadSiteDetails()
    } catch (error) {
      this.showError()
    }
  }

  destroy() {
    this.destroyed = true
    if (this.map) {
      this.map.setTarget(null)
      this.map = null
    }
    this.vectorSource = null
    this.vectorLayer = null
    this.geoJSONFormat = null
    this.olModules = null
  }

  async loadOpenLayersModules() {
    const modules = await this.importOpenLayersModules()
    this.setupOpenLayersModules(modules)
    this.initializeGeoJSONFormat(modules.GeoJSON)
  }

  async importOpenLayersModules() {
    const [
      ,
      { default: OpenLayersMap },
      { default: View },
      { default: TileLayer },
      { default: OSM },
      { default: VectorLayer },
      { default: VectorSource },
      { default: Feature },
      { default: Point },
      { default: CircleGeom },
      { Style, Fill, Stroke, Circle },
      { fromLonLat, toLonLat },
      { default: GeoJSON },
      { default: Polygon }
    ] = await Promise.all([
      import('ol/ol.css'),
      import('ol/Map.js'),
      import('ol/View.js'),
      import('ol/layer/Tile.js'),
      import('ol/source/OSM.js'),
      import('ol/layer/Vector.js'),
      import('ol/source/Vector.js'),
      import('ol/Feature.js'),
      import('ol/geom/Point.js'),
      import('ol/geom/Circle.js'),
      import('ol/style.js'),
      import('ol/proj.js'),
      import('ol/format/GeoJSON.js'),
      import('ol/geom/Polygon.js')
    ])

    return {
      OpenLayersMap,
      View,
      TileLayer,
      OSM,
      VectorLayer,
      VectorSource,
      Feature,
      Point,
      CircleGeom,
      Polygon,
      Style,
      Fill,
      Stroke,
      Circle,
      fromLonLat,
      toLonLat,
      GeoJSON
    }
  }

  setupOpenLayersModules(modules) {
    this.olModules = modules
  }

  initializeGeoJSONFormat(GeoJSON) {
    this.geoJSONFormat = new GeoJSON()
  }

  createMapLayers() {
    const { VectorSource, VectorLayer } = this.olModules
    this.vectorSource = new VectorSource()
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: this.createDefaultStyle()
    })
  }

  createMap() {
    const { OpenLayersMap, View, TileLayer, OSM, fromLonLat } = this.olModules
    this.map = new OpenLayersMap({
      target: this.$root,
      layers: [
        new TileLayer({
          source: new OSM({
            attributions: []
          })
        }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat(this.options.center),
        zoom: this.options.zoom
      }),
      controls: []
    })
  }

  showError() {
    this.$root.innerHTML =
      '<div class="app-site-details-map__error">Failed to load map. Please refresh the page.</div>'
  }

  createDefaultStyle() {
    const { Style, Fill, Stroke, Circle } = this.olModules
    return new Style({
      fill: new Fill({
        color: 'transparent'
      }),
      stroke: new Stroke({
        color: '#000000',
        width: STROKE_WIDTH_PIXELS
      }),
      image: new Circle({
        radius: 7,
        fill: new Fill({
          color: 'transparent'
        }),
        stroke: new Stroke({
          color: '#000000',
          width: STROKE_WIDTH_PIXELS
        })
      })
    })
  }

  loadSiteDetails() {
    const siteDataElement = document.getElementById('site-details-data')
    if (!siteDataElement) {
      return
    }

    try {
      const siteDetails = JSON.parse(siteDataElement.textContent)
      this.displaySiteDetails(siteDetails)
    } catch (error) {
      this.showError()
    }
  }

  displaySiteDetails(siteDetails) {
    this.vectorSource.clear()

    if (siteDetails.coordinatesType === 'file' && siteDetails.geoJSON) {
      this.displayFileUploadData(siteDetails.geoJSON)
    } else if (siteDetails.coordinatesType === 'coordinates') {
      this.displayManualCoordinates(siteDetails)
    } else {
      this.showError()
    }
  }

  displayFileUploadData(geoJSON) {
    if (!geoJSON.features || !Array.isArray(geoJSON.features)) {
      return
    }

    const features = this.geoJSONFormat.readFeatures(geoJSON, {
      featureProjection: 'EPSG:3857'
    })

    this.vectorSource.addFeatures(features)

    if (features.length > 0) {
      const extent = this.vectorSource.getExtent()
      this.map.getView().fit(extent, {
        padding: [
          MAP_PADDING_PIXELS,
          MAP_PADDING_PIXELS,
          MAP_PADDING_PIXELS,
          MAP_PADDING_PIXELS
        ],
        maxZoom: MAX_ZOOM_LEVEL
      })
    }
  }

  displayManualCoordinates(siteDetails) {
    const { coordinateSystem, coordinates } = siteDetails
    const { fromLonLat } = this.olModules

    if (!coordinates) {
      return
    }

    const mapCoordinates = this.parseCoordinates(
      coordinateSystem,
      coordinates,
      fromLonLat
    )

    if (!mapCoordinates) {
      return
    }

    if (siteDetails.circleWidth) {
      this.displayCircularSite(mapCoordinates, siteDetails.circleWidth)
    } else {
      this.displayPointSite(mapCoordinates)
    }

    this.map.getView().setCenter(mapCoordinates)
    this.map.getView().setZoom(DETAILED_ZOOM_LEVEL)
  }

  parseCoordinates(coordinateSystem, coordinates, fromLonLat) {
    const isWGS84 = this.isWGS84CoordinateSystem(coordinateSystem)
    const isOSGB36 = this.isOSGB36CoordinateSystem(coordinateSystem)

    if (isWGS84 && this.hasWGS84Coordinates(coordinates)) {
      return this.convertFromLonLat(coordinates, fromLonLat)
    }

    if (isOSGB36 && this.hasOSGB36Coordinates(coordinates)) {
      return this.convertOSGB36ToWebMercator(
        parseFloat(coordinates.eastings),
        parseFloat(coordinates.northings)
      )
    }

    return null
  }

  isWGS84CoordinateSystem(coordinateSystem) {
    return coordinateSystem === 'WGS84' || coordinateSystem === 'wgs84'
  }

  isOSGB36CoordinateSystem(coordinateSystem) {
    return coordinateSystem === 'OSGB36' || coordinateSystem === 'osgb36'
  }

  hasWGS84Coordinates(coordinates) {
    return coordinates.latitude && coordinates.longitude
  }

  hasOSGB36Coordinates(coordinates) {
    return coordinates.eastings && coordinates.northings
  }

  convertFromLonLat(coordinates, fromLonLat) {
    return fromLonLat([
      parseFloat(coordinates.longitude),
      parseFloat(coordinates.latitude)
    ])
  }

  displayPointSite(coordinates) {
    const { Feature, Point } = this.olModules
    const pointFeature = new Feature({
      geometry: new Point(coordinates)
    })
    this.vectorSource.addFeature(pointFeature)
  }

  displayCircularSite(centerCoordinates, radiusInMeters) {
    const { Feature, Polygon, fromLonLat, toLonLat } = this.olModules

    // Convert center coordinates back to WGS84 to work in geographic coordinates
    const centerWGS84 = toLonLat(centerCoordinates)

    // Create circle points in WGS84 (degrees) then convert to Web Mercator
    const circleCoords = this.createGeographicCircle(
      centerWGS84,
      radiusInMeters
    )

    // Convert all points to Web Mercator
    const projectedCoords = circleCoords.map((coord) => fromLonLat(coord))

    const circlePolygon = new Polygon([projectedCoords])
    const circleFeature = new Feature({
      geometry: circlePolygon
    })

    this.vectorSource.addFeature(circleFeature)
  }

  createGeographicCircle(
    centerLonLat,
    radiusInMeters,
    sides = CIRCLE_APPROXIMATION_SIDES
  ) {
    return CircleGeometryCalculator.createGeographicCircle(
      centerLonLat,
      radiusInMeters,
      sides
    )
  }

  convertOSGB36ToWebMercator(eastings, northings) {
    const { fromLonLat } = this.olModules
    const wgs84Coords = GeographicCoordinateConverter.osgb36ToWgs84(
      eastings,
      northings
    )
    return fromLonLat(wgs84Coords)
  }
}

export default SiteDetailsMap
