import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

export const getPayload = (siteDetails, coordinateSystem) => {
  if (coordinateSystem === COORDINATE_SYSTEMS.OSGB36) {
    return {
      eastings: siteDetails.coordinates?.eastings,
      northings: siteDetails.coordinates?.northings
    }
  }
  return {
    latitude: siteDetails.coordinates?.latitude,
    longitude: siteDetails.coordinates?.longitude
  }
}
