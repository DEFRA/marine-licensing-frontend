import { clone } from '@hapi/hoek'

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
