import { Component } from 'govuk-frontend'
import CoordinateParser from './CoordinateParser.js'
import MapFactory from './MapFactory.js'
import SiteDataLoader from './SiteDataLoader.js'
import SiteVisualizer from './SiteVisualizer.js'

const DEFAULT_UK_CENTER_LONGITUDE = -3.5
const DEFAULT_UK_CENTER_LATITUDE = 54.0
const DEFAULT_MAP_ZOOM = 6
const DETAILED_ZOOM_LEVEL = 14

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
    this.destroyed = false

    this.coordinateParser = new CoordinateParser()
    this.dataLoader = new SiteDataLoader()
    this.mapFactory = null
    this.siteVisualizer = null

    this.scheduleMapInitialization()
  }

  scheduleMapInitialization() {
    setTimeout(() => {
      this.initializeMap().catch(() => {
        this.showError()
      })
    }, 0)
  }

  async loadOpenLayersModules() {
    const [
      { default: OpenLayersMap },
      { default: View },
      { default: TileLayer },
      { default: OSM }
    ] = await Promise.all([
      import('ol/Map.js'),
      import('ol/View.js'),
      import('ol/layer/Tile.js'),
      import('ol/source/OSM.js')
    ])

    const [
      { default: VectorLayer },
      { default: VectorSource },
      { default: Feature },
      { Style, Fill, Stroke, Circle }
    ] = await Promise.all([
      import('ol/layer/Vector.js'),
      import('ol/source/Vector.js'),
      import('ol/Feature.js'),
      import('ol/style.js')
    ])

    const [
      { default: Point },
      { default: Polygon },
      { fromLonLat, toLonLat },
      { default: GeoJSON }
    ] = await Promise.all([
      import('ol/geom/Point.js'),
      import('ol/geom/Polygon.js'),
      import('ol/proj.js'),
      import('ol/format/GeoJSON.js')
    ])

    const [{ default: Attribution }, { defaults: defaultControls }] =
      await Promise.all([
        import('ol/control/Attribution.js'),
        import('ol/control/defaults.js')
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
      Polygon,
      Style,
      Fill,
      Stroke,
      Circle,
      fromLonLat,
      toLonLat,
      GeoJSON,
      Attribution,
      defaultControls
    }
  }

  async initializeMap() {
    try {
      const olModules = await this.loadOpenLayersModules()

      if (this.destroyed) {
        return
      }

      this.mapFactory = new MapFactory(olModules)
      const { vectorSource, vectorLayer } = this.mapFactory.createMapLayers()
      const geoJSONFormat = this.mapFactory.initializeGeoJSONFormat(
        olModules.GeoJSON
      )

      this.siteVisualizer = new SiteVisualizer(
        olModules,
        vectorSource,
        geoJSONFormat,
        null
      )

      this.map = this.mapFactory.createMap(
        this.$root,
        this.options,
        vectorLayer
      )

      this.siteVisualizer.map = this.map
      this.loadAndDisplaySiteDetails()
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
    this.mapFactory = null
    this.siteVisualizer = null
  }

  loadAndDisplaySiteDetails() {
    const siteDetails = this.dataLoader.loadSiteDetails()
    if (!siteDetails) {
      return
    }

    this.displaySiteDetails(siteDetails)
  }

  /**
   * Display site details based on coordinate type
   * @param {object} siteDetails - Site details data
   */
  displaySiteDetails(siteDetails) {
    if (!this.siteVisualizer) {
      return
    }

    this.siteVisualizer.clearFeatures()

    if (this.dataLoader.hasValidFileCoordinates(siteDetails)) {
      this.siteVisualizer.displayFileUploadData(siteDetails.geoJSON)
    } else if (this.dataLoader.hasValidManualCoordinates(siteDetails)) {
      this.displayManualCoordinates(siteDetails)
    } else {
      this.showError()
    }
  }

  /**
   * Display manual coordinates (point or circle)
   * @param {object} siteDetails - Site details with manual coordinates
   */
  displayManualCoordinates(siteDetails) {
    const { coordinateSystem, coordinates, circleWidth } = siteDetails

    if (!coordinates) {
      return
    }

    const fromLonLat = this.getFromLonLatFunction()
    if (!fromLonLat) {
      return
    }

    const mapCoordinates = this.coordinateParser.parseCoordinates(
      coordinateSystem,
      coordinates,
      fromLonLat
    )

    if (!mapCoordinates) {
      return
    }

    this.renderSiteGeometry(mapCoordinates, circleWidth)
    this.centerMapOnCoordinates(mapCoordinates)
  }

  getFromLonLatFunction() {
    return this.siteVisualizer?.olModules?.fromLonLat || null
  }

  renderSiteGeometry(mapCoordinates, circleWidth) {
    if (!this.siteVisualizer) {
      return
    }

    if (circleWidth) {
      this.siteVisualizer.displayCircularSite(mapCoordinates, circleWidth)
    } else {
      this.siteVisualizer.displayPointSite(mapCoordinates)
    }
  }

  centerMapOnCoordinates(mapCoordinates) {
    if (this.siteVisualizer) {
      this.siteVisualizer.centerMapView(mapCoordinates, DETAILED_ZOOM_LEVEL)
    }
  }

  showError() {
    this.$root.innerHTML =
      '<div class="app-site-details-map__error">Failed to load map. Please refresh the page.</div>'
  }
}

export default SiteDetailsMap
