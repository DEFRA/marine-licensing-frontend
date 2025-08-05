const EARTH_RADIUS_METRES = 6378137
const DEGREES_TO_RADIANS_FACTOR = 180
const CIRCLE_APPROXIMATION_SIDES = 64

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
    const centreLatRad = (centreLat * Math.PI) / DEGREES_TO_RADIANS_FACTOR
    const centreLonRad = (centreLon * Math.PI) / DEGREES_TO_RADIANS_FACTOR

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

    return [
      (lon * DEGREES_TO_RADIANS_FACTOR) / Math.PI,
      (lat * DEGREES_TO_RADIANS_FACTOR) / Math.PI
    ]
  }
}

export default CircleGeometryCalculator
