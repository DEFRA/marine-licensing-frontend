const DEFAULT_UK_CENTRE_LONGITUDE = -3.5
const DEFAULT_UK_CENTRE_LATITUDE = 54.0
const DEFAULT_MAP_PADDING = 100

class MapViewManager {
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
      if (extent?.every((coord) => Number.isFinite(coord))) {
        map.getView().fit(extent, fitOptions)
      } else {
        this.centreMapView(map, [
          DEFAULT_UK_CENTRE_LONGITUDE,
          DEFAULT_UK_CENTRE_LATITUDE
        ])
      }
    } catch (error) {
      this.centreMapView(map, [
        DEFAULT_UK_CENTRE_LONGITUDE,
        DEFAULT_UK_CENTRE_LATITUDE
      ])
    }
  }

  fitMapToGeometry(map, geometry, options = {}) {
    const extent = geometry.getExtent()
    this.fitMapToExtent(map, extent, options)
  }

  fitMapToAllFeatures(map, vectorSource, options = {}) {
    const extent = vectorSource.getExtent()
    this.fitMapToExtent(map, extent, options)
  }

  centreMapView(map, mapCoordinates, zoomLevel = 12) {
    map.getView().setCenter(mapCoordinates)
    map.getView().setZoom(zoomLevel)
  }
}

export default MapViewManager
