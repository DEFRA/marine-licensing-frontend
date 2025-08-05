import { Component } from 'govuk-frontend'
import MapFactory from './map-factory.js'
import OpenLayersModuleLoader from './openlayers-module-loader.js'
import SiteDataLoader from './site-data-loader.js'
import SiteVisualiser from './site-visualiser.js'

const DEFAULT_UK_CENTRE_LONGITUDE = -3.5
const DEFAULT_UK_CENTRE_LATITUDE = 54.0
const DEFAULT_MAP_ZOOM = 6

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
    this.dataLoader = new SiteDataLoader()
    this.mapFactory = null
    this.siteVisualiser = null
    this.moduleLoader = moduleLoader ?? new OpenLayersModuleLoader()

    this.scheduleMapInitialisation()
  }

  scheduleMapInitialisation() {
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

    this.siteVisualiser = new SiteVisualiser(
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
   * @returns {string|null} - Type of display action taken: 'file', 'manual', 'error', or null if no visualiser
   */
  displaySiteDetails(siteDetails) {
    if (!this.siteVisualiser) {
      return null
    }

    this.siteVisualiser.clearFeatures()

    if (this.dataLoader.hasValidFileCoordinates(siteDetails)) {
      this.siteVisualiser.displayFileUploadData(siteDetails.geoJSON)
      return 'file'
    } else if (this.dataLoader.hasValidManualCoordinates(siteDetails)) {
      this.siteVisualiser.displayManualCoordinates(siteDetails)
      return 'manual'
    } else {
      this.showError()
      return 'error'
    }
  }

  showError() {
    this.$root.innerHTML =
      '<div class="app-site-details-map__error">Failed to load map. Please refresh the page.</div>'
  }
}

export default SiteDetailsMap
