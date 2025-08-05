import { Component } from 'govuk-frontend'
import CoordinateParser from './coordinate-parser.js'
import MapFactory from './map-factory.js'
import OpenLayersModuleLoader from './openlayers-module-loader.js'
import SiteDataLoader from './site-data-loader.js'
import SiteVisualizer from './site-visualizer.js'

const DEFAULT_UK_CENTRE_LONGITUDE = -3.5
const DEFAULT_UK_CENTRE_LATITUDE = 54.0
const DEFAULT_MAP_ZOOM = 6
const DETAILED_ZOOM_LEVEL = 14

export class SiteDetailsMap extends Component {
  static moduleName = 'site-details-map'

  constructor($root, options = {}, moduleLoader = null) {
    super($root)

    this.options = {
      center: [DEFAULT_UK_CENTRE_LONGITUDE, DEFAULT_UK_CENTRE_LATITUDE],
      zoom: DEFAULT_MAP_ZOOM,
      ...options
    }

    this.map = null

    this.coordinateParser = new CoordinateParser()
    this.dataLoader = new SiteDataLoader()
    this.mapFactory = null
    this.siteVisualizer = null
    this.moduleLoader = moduleLoader ?? new OpenLayersModuleLoader()

    this.scheduleMapInitialization()
  }

  scheduleMapInitialization() {
    setTimeout(() => {
      this.initialiseMap().catch(() => {
        this.showError()
      })
    }, 0)
  }

  async initialiseMap() {
    const siteDetails = this.dataLoader.loadSiteDetails()
    if (!siteDetails) {
      this.showError()
      return
    }

    if (!this.hasValidSiteDetails(siteDetails)) {
      this.showError()
      return
    }

    const olModules = await this.moduleLoader.loadModules()

    this.mapFactory = new MapFactory(olModules)
    const { vectorSource, vectorLayer } = this.mapFactory.createMapLayers()
    const geoJSONFormat = this.mapFactory.initialiseGeoJSONFormat()

    this.map = this.mapFactory.createMap(this.$root, this.options, vectorLayer)

    this.siteVisualizer = new SiteVisualizer(
      olModules,
      vectorSource,
      geoJSONFormat,
      this.map
    )

    this.displaySiteDetails(siteDetails)
  }

  hasValidSiteDetails(siteDetails) {
    return (
      this.dataLoader.hasValidFileCoordinates(siteDetails) ||
      this.dataLoader.hasValidManualCoordinates(siteDetails)
    )
  }

  /**
   * Display site details based on coordinate type
   * @param {object} siteDetails - Site details data
   * @returns {string|null} - Type of display action taken: 'file', 'manual', 'error', or null if no visualizer
   */
  displaySiteDetails(siteDetails) {
    if (!this.siteVisualizer) {
      return null
    }

    this.siteVisualizer.clearFeatures()

    if (this.dataLoader.hasValidFileCoordinates(siteDetails)) {
      this.siteVisualizer.displayFileUploadData(siteDetails.geoJSON)
      return 'file'
    } else if (this.dataLoader.hasValidManualCoordinates(siteDetails)) {
      this.displayManualCoordinates(siteDetails)
      return 'manual'
    } else {
      this.showError()
      return 'error'
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
    this.centreMapOnCoordinates(mapCoordinates)
  }

  getFromLonLatFunction() {
    return this.siteVisualizer?.olModules?.fromLonLat || null
  }

  renderSiteGeometry(mapCoordinates, circleWidth) {
    if (!this.siteVisualizer) {
      return null
    }

    if (circleWidth) {
      this.siteVisualizer.displayCircularSite(mapCoordinates, circleWidth)
      return 'circle'
    } else {
      this.siteVisualizer.displayPointSite(mapCoordinates)
      return 'point'
    }
  }

  centreMapOnCoordinates(mapCoordinates) {
    if (this.siteVisualizer) {
      this.siteVisualizer.centreMapView(mapCoordinates, DETAILED_ZOOM_LEVEL)
      return true
    }
    return false
  }

  showError() {
    this.$root.innerHTML =
      '<div class="app-site-details-map__error">Failed to load map. Please refresh the page.</div>'
  }
}

export default SiteDetailsMap
