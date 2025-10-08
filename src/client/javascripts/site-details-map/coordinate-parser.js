import GeographicCoordinateConverter from './geographic-coordinate-converter.js'

const MINIMUM_POLYGON_COORDINATES = 3

class CoordinateParser {
  parseCoordinates(coordinateSystem, coordinates, fromLonLatFunction) {
    if (Array.isArray(coordinates)) {
      return this.parseMultipleCoordinates(
        coordinateSystem,
        coordinates,
        fromLonLatFunction
      )
    }
    const isWGS84 = this.isWGS84CoordinateSystem(coordinateSystem)
    const isOSGB36 = this.isOSGB36CoordinateSystem(coordinateSystem)

    if (isWGS84 && this.hasWGS84Coordinates(coordinates)) {
      return this.convertFromLonLat(coordinates, fromLonLatFunction)
    }

    if (isOSGB36 && this.hasOSGB36Coordinates(coordinates)) {
      return this.convertOSGB36ToWebMercator(
        parseFloat(coordinates.eastings),
        parseFloat(coordinates.northings),
        fromLonLatFunction
      )
    }

    return null
  }
  parseMultipleCoordinates(
    coordinateSystem,
    coordinatesArray,
    fromLonLatFunction
  ) {
    if (
      !coordinatesArray ||
      coordinatesArray.length < MINIMUM_POLYGON_COORDINATES
    ) {
      return null
    }

    const parsedCoordinates = []

    for (const coord of coordinatesArray) {
      const parsed = this.parseCoordinates(
        coordinateSystem,
        coord,
        fromLonLatFunction
      )
      if (parsed) {
        parsedCoordinates.push(parsed)
      }
    }

    return parsedCoordinates.length >= MINIMUM_POLYGON_COORDINATES
      ? parsedCoordinates
      : null
  }
  isWGS84CoordinateSystem(coordinateSystem) {
    return coordinateSystem === 'WGS84' || coordinateSystem === 'wgs84'
  }
  isOSGB36CoordinateSystem(coordinateSystem) {
    return coordinateSystem === 'OSGB36' || coordinateSystem === 'osgb36'
  }
  hasWGS84Coordinates(coordinates) {
    return coordinates.latitude && coordinates.longitude
  }
  hasOSGB36Coordinates(coordinates) {
    return coordinates.eastings && coordinates.northings
  }
  convertFromLonLat(coordinates, fromLonLatFunction) {
    return fromLonLatFunction([
      parseFloat(coordinates.longitude),
      parseFloat(coordinates.latitude)
    ])
  }
  convertOSGB36ToWebMercator(eastings, northings, fromLonLatFunction) {
    const wgs84Coords = GeographicCoordinateConverter.osgb36ToWgs84(
      eastings,
      northings
    )
    return fromLonLatFunction(wgs84Coords)
  }
}

export default CoordinateParser
