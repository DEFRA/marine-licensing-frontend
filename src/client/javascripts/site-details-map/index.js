import { Component } from 'govuk-frontend'

const DEFAULT_UK_CENTER_LONGITUDE = -3.5
const DEFAULT_UK_CENTER_LATITUDE = 54.0
const DEFAULT_MAP_ZOOM = 6
const DETAILED_ZOOM_LEVEL = 14
const MAX_ZOOM_LEVEL = 16

const EARTH_RADIUS_METERS = 6378137
const DEGREES_TO_RADIANS_FACTOR = 180
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

    this.initializeMap().catch(() => {
      this.showError()
    })
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

    this.olModules = {
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
    const [centerLon, centerLat] = centerLonLat
    const coordinates = []
    const earthRadius = EARTH_RADIUS_METERS
    const angularDistance = radiusInMeters / earthRadius

    for (let i = 0; i <= sides; i++) {
      const bearing = (i * 2 * Math.PI) / sides
      const point = this.calculateCirclePoint(
        centerLon,
        centerLat,
        angularDistance,
        bearing
      )
      coordinates.push(point)
    }

    return coordinates
  }

  calculateCirclePoint(centerLon, centerLat, angularDistance, bearing) {
    const centerLatRad = (centerLat * Math.PI) / DEGREES_TO_RADIANS_FACTOR
    const centerLonRad = (centerLon * Math.PI) / DEGREES_TO_RADIANS_FACTOR

    const lat = Math.asin(
      Math.sin(centerLatRad) * Math.cos(angularDistance) +
        Math.cos(centerLatRad) * Math.sin(angularDistance) * Math.cos(bearing)
    )

    const lon =
      centerLonRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLatRad),
        Math.cos(angularDistance) - Math.sin(centerLatRad) * Math.sin(lat)
      )

    return [
      (lon * DEGREES_TO_RADIANS_FACTOR) / Math.PI,
      (lat * DEGREES_TO_RADIANS_FACTOR) / Math.PI
    ]
  }

  convertOSGB36ToWebMercator(eastings, northings) {
    const { fromLonLat } = this.olModules
    const wgs84Coords = osgb36ToWgs84(eastings, northings)
    return fromLonLat(wgs84Coords)
  }
}

// OSGB36 to WGS84 conversion function (extracted as standalone utility)
function osgb36ToWgs84(eastings, northings) {
  const a = 6377563.396
  const b = 6356256.909
  const F0 = 0.9996012717
  const lat0 = (49 * Math.PI) / DEGREES_TO_RADIANS_FACTOR
  const lon0 = (-2 * Math.PI) / DEGREES_TO_RADIANS_FACTOR
  const N0 = -100000
  const E0 = 400000
  const e2 = 1 - (b * b) / (a * a)
  const n = (a - b) / (a + b)

  const lat = lat0

  let latNew = lat
  for (let i = 0; i < 10; i++) {
    const Ma = (1 + n + (5 / 4) * n * n + (5 / 4) * n * n * n) * (latNew - lat0)
    const Mb =
      (3 * n + 3 * n * n + (21 / 8) * n * n * n) *
      Math.sin(latNew - lat0) *
      Math.cos(latNew + lat0)
    const Mc =
      ((15 / 8) * n * n + (15 / 8) * n * n * n) *
      Math.sin(2 * (latNew - lat0)) *
      Math.cos(2 * (latNew + lat0))
    const Md =
      (35 / 24) *
      n *
      n *
      n *
      Math.sin(3 * (latNew - lat0)) *
      Math.cos(3 * (latNew + lat0))
    const mNew = b * F0 * (Ma - Mb + Mc - Md)

    latNew = latNew + (northings - N0 - mNew) / (a * F0)
    if (Math.abs(northings - N0 - mNew) < 0.01) {
      break
    }
  }

  const v = (a * F0) / Math.sqrt(1 - e2 * Math.sin(latNew) * Math.sin(latNew))
  const rho =
    (a * F0 * (1 - e2)) /
    Math.pow(1 - e2 * Math.sin(latNew) * Math.sin(latNew), 1.5)
  const eta2 = v / rho - 1

  const tanLat = Math.tan(latNew)
  const secLat = 1 / Math.cos(latNew)

  const VII = tanLat / (2 * rho * v)
  const VIII =
    (tanLat / (24 * rho * Math.pow(v, 3))) *
    (5 + 3 * tanLat * tanLat + eta2 - 9 * tanLat * tanLat * eta2)
  const IX =
    (tanLat / (720 * rho * Math.pow(v, 5))) *
    (61 + 90 * tanLat * tanLat + 45 * tanLat * tanLat * tanLat * tanLat)

  const X = secLat / v
  const XI = (secLat / (6 * Math.pow(v, 3))) * (v / rho + 2 * tanLat * tanLat)
  const XII =
    (secLat / (120 * Math.pow(v, 5))) *
    (5 + 28 * tanLat * tanLat + 24 * tanLat * tanLat * tanLat * tanLat)

  const dE = eastings - E0
  const latFinal =
    latNew - VII * dE * dE + VIII * Math.pow(dE, 4) - IX * Math.pow(dE, 6)
  const lonFinal = lon0 + X * dE - XI * Math.pow(dE, 3) + XII * Math.pow(dE, 5)

  return [
    (lonFinal * DEGREES_TO_RADIANS_FACTOR) / Math.PI,
    (latFinal * DEGREES_TO_RADIANS_FACTOR) / Math.PI
  ]
}
