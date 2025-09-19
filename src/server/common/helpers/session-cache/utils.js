import { clone } from '@hapi/hoek'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-details-utils.js'
export const EXEMPTION_CACHE_KEY = 'exemption'

/**
 * @param { Request } request
 */
export const clearExemptionCache = (request) => {
  request.yar.clear(EXEMPTION_CACHE_KEY)
}

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
 * @param { number } siteIndex
 * @param { string } key
 * @param { {} } value
 */
export const updateExemptionSiteDetails = (request, siteIndex, key, value) => {
  const existingCache = getExemptionCache(request)
  const existingSiteDetails = existingCache.siteDetails || []
  const cacheValue = value ?? null

  const updatedSiteDetails = [...existingSiteDetails]

  updatedSiteDetails[siteIndex] = {
    ...updatedSiteDetails[siteIndex],
    [key]: cacheValue
  }

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })

  return { [key]: cacheValue }
}

/**
 * @param { Request } request
 * @param { string } key
 * @param { {} } value
 */
export const updateExemptionMultipleSiteDetails = (request, key, value) => {
  const existingCache = getExemptionCache(request)
  const existingMultipleSiteDetails = existingCache.multipleSiteDetails
  const cacheValue = value ?? null

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    multipleSiteDetails: { ...existingMultipleSiteDetails, [key]: cacheValue }
  })

  return { [key]: cacheValue }
}

/**
 * @param { Request } request
 */
export const resetExemptionSiteDetails = (request) => {
  const existingCache = getExemptionCache(request)
  delete existingCache.multipleSiteDetails
  delete existingCache.siteDetails
  request.yar.set(EXEMPTION_CACHE_KEY, existingCache)
  return { siteDetails: null }
}

/**
 * @param { Request } request
 * @param { object } updates - Object containing key-value pairs to update in siteDetails
 */
export const updateExemptionSiteDetailsBatch = (request, updates) => {
  const existingCache = getExemptionCache(request)

  const existingSiteDetails = getSiteDetailsBySite(existingCache)

  // Apply all updates in a single operation
  const updatedSiteDetails = {
    ...existingSiteDetails,
    ...updates
  }

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    siteDetails: [updatedSiteDetails]
  })

  return updatedSiteDetails
}
