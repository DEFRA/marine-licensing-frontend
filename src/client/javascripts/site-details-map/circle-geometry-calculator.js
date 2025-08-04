const EARTH_RADIUS_METERS = 6378137
const DEGREES_TO_RADIANS_FACTOR = 180
const CIRCLE_APPROXIMATION_SIDES = 64

class CircleGeometryCalculator {
  static createGeographicCircle(
    centerLonLat,
    radiusInMeters,
    sides = CIRCLE_APPROXIMATION_SIDES
  ) {
    const [centerLon, centerLat] = centerLonLat
    const coordinates = []
    const earthRadius = EARTH_RADIUS_METERS
    const angularDistance = radiusInMeters / earthRadius

    for (let i = 0; i <= sides; i++) {
      const bearing = (i * 2 * Math.PI) / sides
      const point = this.calculateCirclePoint(
        centerLon,
        centerLat,
        angularDistance,
        bearing
      )
      coordinates.push(point)
    }

    return coordinates
  }

  static calculateCirclePoint(centerLon, centerLat, angularDistance, bearing) {
    const centerLatRad = (centerLat * Math.PI) / DEGREES_TO_RADIANS_FACTOR
    const centerLonRad = (centerLon * Math.PI) / DEGREES_TO_RADIANS_FACTOR

    const lat = Math.asin(
      Math.sin(centerLatRad) * Math.cos(angularDistance) +
        Math.cos(centerLatRad) * Math.sin(angularDistance) * Math.cos(bearing)
    )

    const lon =
      centerLonRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLatRad),
        Math.cos(angularDistance) - Math.sin(centerLatRad) * Math.sin(lat)
      )

    return [
      (lon * DEGREES_TO_RADIANS_FACTOR) / Math.PI,
      (lat * DEGREES_TO_RADIANS_FACTOR) / Math.PI
    ]
  }
}

export default CircleGeometryCalculator
