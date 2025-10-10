class SiteDataLoader {
  constructor(mapElement = null) {
    this.mapElement = mapElement
  }

  loadSiteDetails() {
    if (this.mapElement) {
      // Multi site implementation, will become default eventually
      const siteDetailsAttr = this.mapElement.getAttribute('data-site-details') // NOSONAR
      if (siteDetailsAttr) {
        return JSON.parse(siteDetailsAttr)
      }
    }

    // Fallback for single site only pages
    const siteDataElement = document.getElementById('site-details-data')
    if (!siteDataElement) {
      return null
    }

    return JSON.parse(siteDataElement.textContent)
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
