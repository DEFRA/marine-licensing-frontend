import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'

export const getPayload = (siteDetails, coordinateSystem) => {
  if (coordinateSystem === COORDINATE_SYSTEMS.OSGB36) {
    return {
      eastings:
        siteDetails.coordinates?.eastings ?? siteDetails.coordinates?.easting,
      northings:
        siteDetails.coordinates?.northings ?? siteDetails.coordinates?.northing
    }
  }
  return {
    latitude: siteDetails.coordinates?.latitude,
    longitude: siteDetails.coordinates?.longitude
  }
}
