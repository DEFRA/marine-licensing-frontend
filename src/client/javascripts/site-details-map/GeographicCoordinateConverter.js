const DEGREES_TO_RADIANS_FACTOR = 180

// OSGB36 Ellipsoid Constants (Airy 1830)
const OSGB36_SEMI_MAJOR_AXIS = 6377563.396
const OSGB36_SEMI_MINOR_AXIS = 6356256.909
const OSGB36_SCALE_FACTOR = 0.9996012717

// OSGB36 Coordinate System Origin
const OSGB36_TRUE_ORIGIN_LATITUDE = 49
const OSGB36_TRUE_ORIGIN_LONGITUDE = -2
const OSGB36_NORTHING_ORIGIN = -100000
const OSGB36_EASTING_ORIGIN = 400000

// Meridional Arc Series Constants
const MA_COEFFICIENT_1 = 1
const MA_COEFFICIENT_5_4_NUMERATOR = 5
const MA_COEFFICIENT_5_4_DENOMINATOR = 4
const MA_COEFFICIENT_5_4 =
  MA_COEFFICIENT_5_4_NUMERATOR / MA_COEFFICIENT_5_4_DENOMINATOR

const MB_COEFFICIENT_3 = 3
const MB_COEFFICIENT_21_8_NUMERATOR = 21
const MB_COEFFICIENT_21_8_DENOMINATOR = 8
const MB_COEFFICIENT_21_8 =
  MB_COEFFICIENT_21_8_NUMERATOR / MB_COEFFICIENT_21_8_DENOMINATOR

const MC_COEFFICIENT_15_8_NUMERATOR = 15
const MC_COEFFICIENT_15_8_DENOMINATOR = 8
const MC_COEFFICIENT_15_8 =
  MC_COEFFICIENT_15_8_NUMERATOR / MC_COEFFICIENT_15_8_DENOMINATOR

const MD_COEFFICIENT_35_24_NUMERATOR = 35
const MD_COEFFICIENT_35_24_DENOMINATOR = 24
const MD_COEFFICIENT_35_24 =
  MD_COEFFICIENT_35_24_NUMERATOR / MD_COEFFICIENT_35_24_DENOMINATOR

// Convergence and Scale Factor Constants
const CSF_COEFFICIENT_2 = 2
const CSF_COEFFICIENT_3 = 3
const CSF_COEFFICIENT_5 = 5
const CSF_COEFFICIENT_6 = 6
const CSF_COEFFICIENT_9 = 9
const CSF_COEFFICIENT_24 = 24
const CSF_COEFFICIENT_28 = 28
const CSF_COEFFICIENT_45 = 45
const CSF_COEFFICIENT_61 = 61
const CSF_COEFFICIENT_90 = 90
const CSF_COEFFICIENT_120 = 120
const CSF_COEFFICIENT_720 = 720

// Power Constants
const POWER_1_5 = 1.5
const POWER_3 = 3
const POWER_4 = 4
const POWER_5 = 5
const POWER_6 = 6

class GeographicCoordinateConverter {
  static calculateEllipsoidParameters() {
    const a = OSGB36_SEMI_MAJOR_AXIS
    const b = OSGB36_SEMI_MINOR_AXIS
    const n = (a - b) / (a + b)
    const e2 = MA_COEFFICIENT_1 - (b * b) / (a * a)

    return { a, b, n, n2: n * n, n3: n * n * n, e2 }
  }

  static calculateOriginParameters() {
    const lat0 =
      (OSGB36_TRUE_ORIGIN_LATITUDE * Math.PI) / DEGREES_TO_RADIANS_FACTOR
    const lon0 =
      (OSGB36_TRUE_ORIGIN_LONGITUDE * Math.PI) / DEGREES_TO_RADIANS_FACTOR
    const N0 = OSGB36_NORTHING_ORIGIN
    const E0 = OSGB36_EASTING_ORIGIN
    const F0 = OSGB36_SCALE_FACTOR

    return { lat0, lon0, N0, E0, F0 }
  }

  static computeLatitude(parameters, northings) {
    const { lat0, N0, F0, a, b, n, n2, n3 } = parameters
    let lat = lat0
    let mNew

    for (let i = 0; i < 10; i++) {
      const Ma =
        (MA_COEFFICIENT_1 +
          n +
          MA_COEFFICIENT_5_4 * n2 +
          MA_COEFFICIENT_5_4 * n3) *
        (lat - lat0)
      const Mb =
        (MB_COEFFICIENT_3 * n +
          MB_COEFFICIENT_3 * n2 +
          MB_COEFFICIENT_21_8 * n3) *
        Math.sin(lat - lat0) *
        Math.cos(lat + lat0)
      const Mc =
        (MC_COEFFICIENT_15_8 * n2 + MC_COEFFICIENT_15_8 * n3) *
        Math.sin(CSF_COEFFICIENT_2 * (lat - lat0)) *
        Math.cos(CSF_COEFFICIENT_2 * (lat + lat0))
      const Md =
        MD_COEFFICIENT_35_24 *
        n3 *
        Math.sin(CSF_COEFFICIENT_3 * (lat - lat0)) *
        Math.cos(CSF_COEFFICIENT_3 * (lat + lat0))

      mNew = b * F0 * (Ma - Mb + Mc - Md)

      if (Math.abs(northings - N0 - mNew) < 0.01) {
        break
      }
      lat = lat + (northings - N0 - mNew) / (a * F0)
    }
    return lat
  }

  static calculateRadiiOfCurvature(parameters, lat) {
    const { a, F0, e2 } = parameters
    const nu =
      (a * F0) /
      Math.sqrt(MA_COEFFICIENT_1 - e2 * Math.sin(lat) * Math.sin(lat))
    const rho =
      (a * F0 * (MA_COEFFICIENT_1 - e2)) /
      Math.pow(MA_COEFFICIENT_1 - e2 * Math.sin(lat) * Math.sin(lat), POWER_1_5)
    const eta2 = nu / rho - MA_COEFFICIENT_1

    return { nu, rho, eta2 }
  }

  static calculateTransformationCoefficients(radii, lat) {
    const { nu, rho, eta2 } = radii
    const secLat = MA_COEFFICIENT_1 / Math.cos(lat)
    const tanLat = Math.tan(lat)

    const VII = tanLat / (CSF_COEFFICIENT_2 * rho * nu)
    const VIII =
      (tanLat / (CSF_COEFFICIENT_24 * rho * Math.pow(nu, POWER_3))) *
      (CSF_COEFFICIENT_5 +
        CSF_COEFFICIENT_3 * tanLat * tanLat +
        eta2 -
        CSF_COEFFICIENT_9 * tanLat * tanLat * eta2)
    const IX =
      (tanLat / (CSF_COEFFICIENT_720 * rho * Math.pow(nu, POWER_5))) *
      (CSF_COEFFICIENT_61 +
        CSF_COEFFICIENT_90 * tanLat * tanLat +
        CSF_COEFFICIENT_45 * Math.pow(tanLat, POWER_4))

    const X = secLat / nu
    const XI =
      (secLat / (CSF_COEFFICIENT_6 * Math.pow(nu, POWER_3))) *
      (nu / rho + CSF_COEFFICIENT_2 * tanLat * tanLat)
    const XII =
      (secLat / (CSF_COEFFICIENT_120 * Math.pow(nu, POWER_5))) *
      (CSF_COEFFICIENT_5 +
        CSF_COEFFICIENT_28 * tanLat * tanLat +
        CSF_COEFFICIENT_24 * Math.pow(tanLat, POWER_4))

    return { VII, VIII, IX, X, XI, XII }
  }

  static osgb36ToWgs84(eastings, northings) {
    const ellipsoidParams = this.calculateEllipsoidParameters()
    const originParams = this.calculateOriginParameters()
    const allParams = { ...ellipsoidParams, ...originParams }

    const lat = this.computeLatitude(allParams, northings)
    const radii = this.calculateRadiiOfCurvature(allParams, lat)
    const coefficients = this.calculateTransformationCoefficients(radii, lat)

    const dE = eastings - originParams.E0
    const latFinal =
      lat -
      coefficients.VII * dE * dE +
      coefficients.VIII * Math.pow(dE, POWER_4) -
      coefficients.IX * Math.pow(dE, POWER_6)
    const lonFinal =
      originParams.lon0 +
      coefficients.X * dE -
      coefficients.XI * Math.pow(dE, POWER_3) +
      coefficients.XII * Math.pow(dE, POWER_5)

    return [
      (lonFinal * DEGREES_TO_RADIANS_FACTOR) / Math.PI,
      (latFinal * DEGREES_TO_RADIANS_FACTOR) / Math.PI
    ]
  }
}

export default GeographicCoordinateConverter
