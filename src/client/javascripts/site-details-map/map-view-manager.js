const DEFAULT_UK_CENTRE_LONGITUDE = -3.5
const DEFAULT_UK_CENTRE_LATITUDE = 54.0

class MapViewManager {
  /**
   * Core method to fit the map view to an extent with error handling
   * @param {object} map - OpenLayers Map instance
   * @param {Array} extent - OpenLayers extent [minX, minY, maxX, maxY]
   * @param {object} options - Fit options (padding, maxZoom, minZoom)
   */
  fitMapToExtent(map, extent, options = {}) {
    const defaultOptions = {
      padding: [20, 20, 20, 20], // top, right, bottom, left padding in pixels
      maxZoom: 14, // prevent zooming too far in
      minZoom: 8, // prevent zooming too far out
      duration: 500 // smooth animation duration
    }

    const fitOptions = { ...defaultOptions, ...options }

    try {
      // Check if extent is valid (not empty or infinite)
      if (extent?.every((coord) => isFinite(coord))) {
        map.getView().fit(extent, fitOptions)
      } else {
        // Fallback to default UK centre if extent is invalid
        this.centreMapView(map, [
          DEFAULT_UK_CENTRE_LONGITUDE,
          DEFAULT_UK_CENTRE_LATITUDE
        ])
      }
    } catch (error) {
      // Fallback to default view if fitting fails
      this.centreMapView(map, [
        DEFAULT_UK_CENTRE_LONGITUDE,
        DEFAULT_UK_CENTRE_LATITUDE
      ])
    }
  }

  /**
   * Fit the map view to show the extent of a geometry with appropriate zoom
   * @param {object} map - OpenLayers Map instance
   * @param {object} geometry - OpenLayers geometry object
   * @param {object} options - Fit options (padding, maxZoom, minZoom)
   */
  fitMapToGeometry(map, geometry, options = {}) {
    const extent = geometry.getExtent()
    this.fitMapToExtent(map, extent, options)
  }

  /**
   * Fit the map view to show all features in the vector source
   * @param {object} map - OpenLayers Map instance
   * @param {object} vectorSource - OpenLayers VectorSource instance
   * @param {object} options - Fit options (padding, maxZoom, minZoom)
   */
  fitMapToAllFeatures(map, vectorSource, options = {}) {
    const extent = vectorSource.getExtent()
    this.fitMapToExtent(map, extent, options)
  }

  /**
   * Centre the map view on specific coordinates
   * @param {object} map - OpenLayers Map instance
   * @param {Array} mapCoordinates - Web Mercator coordinates [x, y]
   * @param {number} zoomLevel - Zoom level to set
   */
  centreMapView(map, mapCoordinates, zoomLevel = 12) {
    map.getView().setCenter(mapCoordinates)
    map.getView().setZoom(zoomLevel)
  }
}

export default MapViewManager
