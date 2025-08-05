const EARTH_RADIUS_METRES = 6378137
const CIRCLE_APPROXIMATION_SIDES = 64
const DEGREES_IN_SEMICIRCLE = 180
const DEGREES_TO_RADIANS = Math.PI / DEGREES_IN_SEMICIRCLE
const RADIANS_TO_DEGREES = DEGREES_IN_SEMICIRCLE / Math.PI

class CircleGeometryCalculator {
  static createGeographicCircle(
    centreLonLat,
    radiusInMetres,
    sides = CIRCLE_APPROXIMATION_SIDES
  ) {
    const [centreLon, centreLat] = centreLonLat
    const coordinates = []
    const earthRadius = EARTH_RADIUS_METRES
    const angularDistance = radiusInMetres / earthRadius

    for (let i = 0; i <= sides; i++) {
      const bearing = (i * 2 * Math.PI) / sides
      const point = this.calculateCirclePoint(
        centreLon,
        centreLat,
        angularDistance,
        bearing
      )
      coordinates.push(point)
    }

    return coordinates
  }

  static calculateCirclePoint(centreLon, centreLat, angularDistance, bearing) {
    const centreLatRad = centreLat * DEGREES_TO_RADIANS
    const centreLonRad = centreLon * DEGREES_TO_RADIANS

    const lat = Math.asin(
      Math.sin(centreLatRad) * Math.cos(angularDistance) +
        Math.cos(centreLatRad) * Math.sin(angularDistance) * Math.cos(bearing)
    )

    const lon =
      centreLonRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centreLatRad),
        Math.cos(angularDistance) - Math.sin(centreLatRad) * Math.sin(lat)
      )

    return [lon * RADIANS_TO_DEGREES, lat * RADIANS_TO_DEGREES]
  }
}

export default CircleGeometryCalculator
