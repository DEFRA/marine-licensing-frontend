import CircleGeometryCalculator from './circle-geometry-calculator.js'

const MINIMUM_POLYGON_COORDINATES = 3

class FeatureFactory {
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
