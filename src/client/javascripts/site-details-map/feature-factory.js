import CircleGeometryCalculator from './circle-geometry-calculator.js'

class FeatureFactory {
  /**
   * Create a point feature
   * @param {object} olModules - OpenLayers modules
   * @param {Array} coordinates - Web Mercator coordinates [x, y]
   * @returns {object} OpenLayers Feature with Point geometry
   */
  createPointFeature(olModules, coordinates) {
    const { Feature, Point } = olModules
    return new Feature({
      geometry: new Point(coordinates)
    })
  }

  /**
   * Create a circular feature
   * @param {object} olModules - OpenLayers modules
   * @param {Array} centreCoordinates - Web Mercator centre coordinates [x, y]
   * @param {number} diameterInMetres - Diameter (width) in metres
   * @returns {object} OpenLayers Feature with Polygon geometry
   */
  createCircleFeature(olModules, centreCoordinates, diameterInMetres) {
    const { Feature, Polygon, fromLonLat, toLonLat } = olModules
    const centreWGS84 = toLonLat(centreCoordinates)

    const radiusInMetres = diameterInMetres / 2
    const circleCoords = CircleGeometryCalculator.createGeographicCircle(
      centreWGS84,
      radiusInMetres
    )

    const projectedCoords = circleCoords.map((coord) => fromLonLat(coord))

    const circlePolygon = new Polygon([projectedCoords])
    return new Feature({
      geometry: circlePolygon
    })
  }

  /**
   * Create features from GeoJSON data
   * @param {object} geoJSONFormat - OpenLayers GeoJSON format instance
   * @param {object} geoJSON - GeoJSON data from file upload
   * @returns {Array} Array of OpenLayers Features
   */
  createFeaturesFromGeoJSON(geoJSONFormat, geoJSON) {
    if (!geoJSON.features || !Array.isArray(geoJSON.features)) {
      return []
    }

    return geoJSONFormat.readFeatures(geoJSON, {
      featureProjection: 'EPSG:3857'
    })
  }
}

export default FeatureFactory
