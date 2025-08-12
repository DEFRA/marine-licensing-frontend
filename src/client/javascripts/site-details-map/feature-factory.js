import CircleGeometryCalculator from './circle-geometry-calculator.js'

const MINIMUM_POLYGON_COORDINATES = 3

class FeatureFactory {
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
   * Create a polygon feature from multiple coordinates
   * @param {object} olModules - OpenLayers modules
   * @param {Array} coordinatesArray - Array of Web Mercator coordinates [[x, y], [x, y], ...]
   * @returns {object} OpenLayers Feature with Polygon geometry
   */
  createPolygonFeature(olModules, coordinatesArray) {
    const { Feature, Polygon } = olModules

    if (
      !coordinatesArray ||
      coordinatesArray.length < MINIMUM_POLYGON_COORDINATES
    ) {
      return null
    }

    const closedCoordinates = [...coordinatesArray]
    const firstCoord = coordinatesArray[0]
    const lastCoord = coordinatesArray[coordinatesArray.length - 1]

    if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
      closedCoordinates.push(firstCoord)
    }

    const polygonGeometry = new Polygon([closedCoordinates])
    return new Feature({
      geometry: polygonGeometry
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
