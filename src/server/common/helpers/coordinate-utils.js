import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import { getExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'

export function extractCoordinatesFromGeoJSON(geoJSON) {
  if (!geoJSON?.features) {
    return []
  }

  const extractedCoordinates = []
  for (const feature of geoJSON.features) {
    if (feature.geometry?.coordinates) {
      extractedCoordinates.push({
        type: feature.geometry.type,
        coordinates: feature.geometry.coordinates
      })
    }
  }

  return extractedCoordinates
}
export const getCoordinateSystem = (request) => {
  const existingCache = getExemptionCache(request)
  const siteIndex = request.site?.siteIndex ?? 0
  const site = getSiteDetailsBySite(existingCache, siteIndex)

  const currentSystem = site.coordinateSystem

  const coordinateSystem =
    currentSystem === COORDINATE_SYSTEMS.OSGB36
      ? COORDINATE_SYSTEMS.OSGB36
      : COORDINATE_SYSTEMS.WGS84

  return { coordinateSystem }
}
