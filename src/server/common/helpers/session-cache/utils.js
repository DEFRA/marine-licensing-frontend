import { clone } from '@hapi/hoek'

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
 * @param { string } key
 * @param { {} } value
 */
export const updateExemptionSiteDetails = (request, key, value) => {
  const existingCache = getExemptionCache(request)
  const existingSiteDetails = existingCache.siteDetails
  const cacheValue = value ?? null

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
 * @param { object } updates - Object containing key-value pairs to update in siteDetails
 */
export const updateExemptionSiteDetailsBatch = (request, updates) => {
  const existingCache = getExemptionCache(request)
  const existingSiteDetails = existingCache.siteDetails || {}

  // Apply all updates in a single operation
  const updatedSiteDetails = {
    ...existingSiteDetails,
    ...updates
  }

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })

  return updatedSiteDetails
}
