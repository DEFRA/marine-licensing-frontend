import { getExemptionCache } from './session-cache/utils.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-details-utils.js'
/**
 * Extract coordinate data from GeoJSON for display purposes
 * @param {object} geoJSON - GeoJSON object containing features
 * @returns {Array} Array of extracted coordinates with type and coordinates properties
 */
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

/**
 * Gets the coordinate system from the exemption cache with fallback to WGS84
 * @param {Request} request - Hapi request object
 * @returns {object} Object containing coordinateSystem property
 */
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
