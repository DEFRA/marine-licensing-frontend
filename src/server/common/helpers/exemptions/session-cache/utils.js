import { clone } from '@hapi/hoek'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import { createSiteDetailsBatchUpdater } from '#src/server/common/helpers/file-upload/build-uploaded-site-details.js'

export const EXEMPTION_CACHE_KEY = 'exemption'
export const SAVED_SITE_DETAILS_CACHE_KEY = 'savedSiteDetails'

export const clearExemptionCache = async (request, h) => {
  request.yar.clear(EXEMPTION_CACHE_KEY)
  await request.yar.commit(h)
}

export const getExemptionCache = (request) => {
  return clone(request.yar.get(EXEMPTION_CACHE_KEY) || {})
}

export const setExemptionCache = async (request, h, value) => {
  const cacheValue = value || {}
  request.yar.set(EXEMPTION_CACHE_KEY, value || {})

  await request.yar.commit(h)

  return cacheValue
}

export const updateExemptionSiteDetails = async (
  request,
  h,
  siteIndex,
  key,
  value
) => {
  const existingCache = getExemptionCache(request)
  const existingSiteDetails = existingCache.siteDetails || []
  const cacheValue = value ?? null

  const updatedSiteDetails = [...existingSiteDetails]

  updatedSiteDetails[siteIndex] = {
    ...updatedSiteDetails[siteIndex],
    [key]: cacheValue
  }

  if (cacheValue === null) {
    delete updatedSiteDetails[siteIndex][key]
  }

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })

  await request.yar.commit(h)

  return { [key]: cacheValue }
}
export const updateExemptionMultipleSiteDetails = async (
  request,
  h,
  key,
  value
) => {
  const existingCache = getExemptionCache(request)
  const existingMultipleSiteDetails = existingCache.multipleSiteDetails
  const cacheValue = value ?? null

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    multipleSiteDetails: { ...existingMultipleSiteDetails, [key]: cacheValue }
  })

  await request.yar.commit(h)

  return { [key]: cacheValue }
}
export const resetExemptionSiteDetails = async (request, h) => {
  const existingCache = getExemptionCache(request)

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    multipleSiteDetails: {},
    siteDetails: []
  })

  await request.yar.commit(h)

  return { siteDetails: null }
}

export const updateExemptionSiteDetailsBatch = createSiteDetailsBatchUpdater({
  cacheKey: EXEMPTION_CACHE_KEY,
  getCache: getExemptionCache,
  getSiteDetails: getSiteDetailsBySite
})

export const clearSavedSiteDetails = async (request, h) => {
  request.yar.clear(SAVED_SITE_DETAILS_CACHE_KEY)

  await request.yar.commit(h)
}

export const setSavedSiteDetails = async (request, h, value) => {
  const cacheValue = value || {}

  request.yar.set(SAVED_SITE_DETAILS_CACHE_KEY, cacheValue)

  await request.yar.commit(h)

  return request.yar.get(SAVED_SITE_DETAILS_CACHE_KEY)
}
