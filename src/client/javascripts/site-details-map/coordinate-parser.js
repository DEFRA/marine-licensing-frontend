import GeographicCoordinateConverter from './geographic-coordinate-converter.js'

class CoordinateParser {
  /**
   * Parse coordinates from any supported coordinate system to Web Mercator
   * @param {string} coordinateSystem - The coordinate system ('WGS84', 'OSGB36')
   * @param {object} coordinates - The coordinate values
   * @param {Function} fromLonLatFunction - OpenLayers fromLonLat function
   * @returns {Array|null} Web Mercator coordinates or null if invalid
   */
  parseCoordinates(coordinateSystem, coordinates, fromLonLatFunction) {
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

  /**
   * Check if coordinate system is WGS84
   * @param {string} coordinateSystem - Coordinate system string
   * @returns {boolean} True if WGS84
   */
  isWGS84CoordinateSystem(coordinateSystem) {
    return coordinateSystem === 'WGS84' || coordinateSystem === 'wgs84'
  }

  /**
   * Check if coordinate system is OSGB36
   * @param {string} coordinateSystem - Coordinate system string
   * @returns {boolean} True if OSGB36
   */
  isOSGB36CoordinateSystem(coordinateSystem) {
    return coordinateSystem === 'OSGB36' || coordinateSystem === 'osgb36'
  }

  /**
   * Check if coordinates object has WGS84 properties
   * @param {object} coordinates - Coordinates object
   * @returns {boolean} True if has latitude and longitude
   */
  hasWGS84Coordinates(coordinates) {
    return coordinates.latitude && coordinates.longitude
  }

  /**
   * Check if coordinates object has OSGB36 properties
   * @param {object} coordinates - Coordinates object
   * @returns {boolean} True if has eastings and northings
   */
  hasOSGB36Coordinates(coordinates) {
    return coordinates.eastings && coordinates.northings
  }

  /**
   * Convert WGS84 coordinates to Web Mercator
   * @param {object} coordinates - WGS84 coordinates
   * @param {Function} fromLonLatFunction - OpenLayers fromLonLat function
   * @returns {Array} Web Mercator coordinates
   */
  convertFromLonLat(coordinates, fromLonLatFunction) {
    return fromLonLatFunction([
      parseFloat(coordinates.longitude),
      parseFloat(coordinates.latitude)
    ])
  }

  /**
   * Convert OSGB36 coordinates to Web Mercator
   * @param {number} eastings - OSGB36 eastings
   * @param {number} northings - OSGB36 northings
   * @param {Function} fromLonLatFunction - OpenLayers fromLonLat function
   * @returns {Array} Web Mercator coordinates
   */
  convertOSGB36ToWebMercator(eastings, northings, fromLonLatFunction) {
    const wgs84Coords = GeographicCoordinateConverter.osgb36ToWgs84(
      eastings,
      northings
    )
    return fromLonLatFunction(wgs84Coords)
  }
}

export default CoordinateParser
