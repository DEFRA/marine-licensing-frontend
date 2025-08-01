const DEGREES_TO_RADIANS_FACTOR = 180

class GeographicCoordinateConverter {
  static osgb36ToWgs84(eastings, northings) {
    const a = 6377563.396
    const b = 6356256.909
    const F0 = 0.9996012717
    const lat0 = (49 * Math.PI) / DEGREES_TO_RADIANS_FACTOR
    const lon0 = (-2 * Math.PI) / DEGREES_TO_RADIANS_FACTOR
    const N0 = -100000
    const E0 = 400000

    const n = (a - b) / (a + b)
    const n2 = n * n
    const n3 = n * n * n

    const e2 = 1 - (b * b) / (a * a)

    let lat = lat0
    let mNew

    // Iterative calculation to find correct latitude
    for (let i = 0; i < 10; i++) {
      const Ma = (1 + n + (5 / 4) * n2 + (5 / 4) * n3) * (lat - lat0)
      const Mb =
        (3 * n + 3 * n2 + (21 / 8) * n3) *
        Math.sin(lat - lat0) *
        Math.cos(lat + lat0)
      const Mc =
        ((15 / 8) * n2 + (15 / 8) * n3) *
        Math.sin(2 * (lat - lat0)) *
        Math.cos(2 * (lat + lat0))
      const Md =
        (35 / 24) * n3 * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0))
      mNew = b * F0 * (Ma - Mb + Mc - Md)

      if (Math.abs(northings - N0 - mNew) < 0.01) {
        break
      }
      lat = lat + (northings - N0 - mNew) / (a * F0)
    }

    // Calculate nu with the correct latitude
    const nu = (a * F0) / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat))
    const rho =
      (a * F0 * (1 - e2)) /
      Math.pow(1 - e2 * Math.sin(lat) * Math.sin(lat), 1.5)
    const eta2 = nu / rho - 1

    const secLat = 1 / Math.cos(lat)
    const tanLat = Math.tan(lat)

    const VII = tanLat / (2 * rho * nu)
    const VIII =
      (tanLat / (24 * rho * Math.pow(nu, 3))) *
      (5 + 3 * tanLat * tanLat + eta2 - 9 * tanLat * tanLat * eta2)
    const IX =
      (tanLat / (720 * rho * Math.pow(nu, 5))) *
      (61 + 90 * tanLat * tanLat + 45 * Math.pow(tanLat, 4))

    const X = secLat / nu
    const XI =
      (secLat / (6 * Math.pow(nu, 3))) * (nu / rho + 2 * tanLat * tanLat)
    const XII =
      (secLat / (120 * Math.pow(nu, 5))) *
      (5 + 28 * tanLat * tanLat + 24 * Math.pow(tanLat, 4))

    const dE = eastings - E0
    const latFinal =
      lat - VII * dE * dE + VIII * Math.pow(dE, 4) - IX * Math.pow(dE, 6)
    const lonFinal =
      lon0 + X * dE - XI * Math.pow(dE, 3) + XII * Math.pow(dE, 5)

    return [
      (lonFinal * DEGREES_TO_RADIANS_FACTOR) / Math.PI,
      (latFinal * DEGREES_TO_RADIANS_FACTOR) / Math.PI
    ]
  }
}

export default GeographicCoordinateConverter
