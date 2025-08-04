class SiteDataLoader {
  /**
   * Load site details from DOM element
   * @returns {object|null} Site details object or null if not found/invalid
   */
  loadSiteDetails() {
    const siteDataElement = document.getElementById('site-details-data')
    if (!siteDataElement) {
      return null
    }

    return JSON.parse(siteDataElement.textContent)
  }

  /**
   * Check if the data represents file coordinates with valid geoJSON
   * @param {object} siteDetails - Site details object
   * @returns {boolean} True if file coordinates with valid geoJSON
   */
  hasValidFileCoordinates(siteDetails) {
    return !!(
      siteDetails.coordinatesType === 'file' &&
      siteDetails.geoJSON &&
      typeof siteDetails.geoJSON === 'object'
    )
  }

  /**
   * Check if the data represents manual coordinates
   * @param {object} siteDetails - Site details object
   * @returns {boolean} True if manual coordinates
   */
  hasManualCoordinates(siteDetails) {
    return siteDetails.coordinatesType === 'coordinates'
  }

  /**
   * Validate that manual coordinates have required properties
   * @param {object} siteDetails - Site details object
   * @returns {boolean} True if has valid manual coordinates
   */
  hasValidManualCoordinates(siteDetails) {
    return !!(this.hasManualCoordinates(siteDetails) && siteDetails.coordinates)
  }
}

export default SiteDataLoader
