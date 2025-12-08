import { Component } from 'govuk-frontend'
import MapFactory from './map-factory.js'
import OpenLayersModuleLoader from './openlayers-module-loader.js'
import SiteDataLoader from './site-data-loader.js'
import SiteVisualiser from './site-visualiser.js'
import { logger } from '../error-tracking/logger.js'

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
    this.dataLoader = new SiteDataLoader($root)
    this.mapFactory = null
    this.siteVisualiser = null
    this.moduleLoader = moduleLoader ?? new OpenLayersModuleLoader()

    this.scheduleMapInitialisation()
  }

  scheduleMapInitialisation() {
    setTimeout(() => {
      this.initialiseMap().catch((error) => {
        logger.error('Site details map initialization failed:', error)
        this.showError()
      })
    }, 0)
  }

  async initialiseMap() {
    const siteDetails = this.dataLoader.loadSiteDetails()
    if (!siteDetails) {
      logger.error('Map initialization failed: No site details found in DOM')
      this.showError()
      return
    }

    if (!this.hasValidSiteDetails(siteDetails)) {
      logger.error(
        'Map initialization failed: Invalid site details',
        siteDetails
      )
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
    this.$root.classList.add('site-details-map--error')
  }
}

export default SiteDetailsMap
