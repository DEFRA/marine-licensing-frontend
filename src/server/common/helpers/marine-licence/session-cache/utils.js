import { clone } from '@hapi/hoek'

export const MARINE_LICENCE_CACHE_KEY = 'marineLicence'
export const SAVED_SITE_DETAILS_CACHE_KEY = 'savedMarineLicenceSiteDetails'

export const clearMarineLicenceCache = async (request, h) => {
  request.yar.clear(MARINE_LICENCE_CACHE_KEY)
  await request.yar.commit(h)
}

export const clearSavedMarineLicenceSiteDetails = async (request, h) => {
  request.yar.clear(SAVED_SITE_DETAILS_CACHE_KEY)
  await request.yar.commit(h)
}

export const updateMarineLicenceSiteDetails = async (
  request,
  h,
  siteIndex,
  key,
  value
) => {
  const existingCache = getMarineLicenceCache(request)
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

  request.yar.set(MARINE_LICENCE_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })

  await request.yar.commit(h)

  return { [key]: cacheValue }
}

export const getMarineLicenceCache = (request) => {
  return clone(request.yar.get(MARINE_LICENCE_CACHE_KEY) || {})
}

export const setMarineLicenceCache = async (request, h, value) => {
  const cacheValue = value || {}
  request.yar.set(MARINE_LICENCE_CACHE_KEY, cacheValue)

  await request.yar.commit(h)

  return cacheValue
}
