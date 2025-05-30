import { clone } from '@hapi/hoek'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

export const EXEMPTION_CACHE_KEY = 'exemption'

/**
 * @param { Request } request
 */
export const getExemptionCache = (request) => {
  return clone(request.yar.get(EXEMPTION_CACHE_KEY) || {})
}

/**
 * @param { Request } request
 * @param { {} } value
 */
export const setExemptionCache = (request, value) => {
  const cacheValue = value || {}
  request.yar.set(EXEMPTION_CACHE_KEY, value || {})
  return cacheValue
}

/**
 * @param { Request } request
 * @param { string } key
 * @param { {} } value
 */
export const updateExemptionSiteDetails = (request, key, value) => {
  const existingCache = getExemptionCache(request)
  const existingSiteDetails = existingCache.siteDetails
  const cacheValue = value || undefined

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    siteDetails: { ...existingSiteDetails, [key]: cacheValue }
  })

  return { [key]: cacheValue }
}

/**
 * @param { Request } request
 */
export const resetExemptionSiteDetails = (request) => {
  const existingCache = getExemptionCache(request)
  delete existingCache.siteDetails
  request.yar.set(EXEMPTION_CACHE_KEY, existingCache)
  return { siteDetails: null }
}

/**
 * @param { Request } request
 */
export const getCoordinateSystem = (request) => {
  const existingCache = getExemptionCache(request)
  const currentSystem = existingCache.siteDetails?.coordinateSystem

  const coordinateSystem =
    currentSystem === COORDINATE_SYSTEMS.OSGB36
      ? COORDINATE_SYSTEMS.OSGB36
      : COORDINATE_SYSTEMS.WGS84

  return { coordinateSystem }
}
