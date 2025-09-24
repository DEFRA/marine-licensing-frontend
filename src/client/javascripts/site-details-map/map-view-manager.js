const DEFAULT_UK_CENTRE_LONGITUDE = -3.5
const DEFAULT_UK_CENTRE_LATITUDE = 54.0
const DEFAULT_MAP_PADDING = 100

class MapViewManager {
  /**
   * Core method to fit the map view to an extent with error handling
   * @param {object} map - OpenLayers Map instance
   * @param {Array} extent - OpenLayers extent [minX, minY, maxX, maxY]
   * @param {object} options - Fit options (padding, maxZoom, minZoom, minResolution)
   */
  fitMapToExtent(map, extent, options = {}) {
    const defaultOptions = {
      padding: [
        DEFAULT_MAP_PADDING,
        DEFAULT_MAP_PADDING,
        DEFAULT_MAP_PADDING,
        DEFAULT_MAP_PADDING
      ],
      maxZoom: 14,
      minZoom: 8
    }

    const fitOptions = { ...defaultOptions, ...options }

    try {
      if (extent?.every((coord) => isFinite(coord))) {
        map.getView().fit(extent, fitOptions)
      } else {
        this.centreMapView(map, [
          DEFAULT_UK_CENTRE_LONGITUDE,
          DEFAULT_UK_CENTRE_LATITUDE
        ])
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        'Failed to fit map to extent, falling back to UK centre:',
        error
      )
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
