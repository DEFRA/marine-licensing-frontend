import { logger } from '../error-tracking/logger.js'

class SiteDataLoader {
  constructor(mapElement = null) {
    this.mapElement = mapElement
  }

  loadSiteDetails() {
    try {
      if (this.mapElement) {
        const siteDetailsAttr =
          this.mapElement.getAttribute('data-site-details') // NOSONAR
        if (siteDetailsAttr) {
          return JSON.parse(siteDetailsAttr)
        }
      }

      const siteDataElement = document.getElementById('site-details-data')
      if (!siteDataElement) {
        return null
      }

      return JSON.parse(siteDataElement.textContent)
    } catch (error) {
      logger.error('Failed to parse site details from DOM:', error)
      return null
    }
  }

  hasValidFileCoordinates(siteDetails) {
    return !!(
      siteDetails.coordinatesType === 'file' &&
      siteDetails.geoJSON &&
      typeof siteDetails.geoJSON === 'object'
    )
  }

  hasManualCoordinates(siteDetails) {
    return siteDetails.coordinatesType === 'coordinates'
  }

  hasValidManualCoordinates(siteDetails) {
    return !!(this.hasManualCoordinates(siteDetails) && siteDetails.coordinates)
  }
}

export default SiteDataLoader
