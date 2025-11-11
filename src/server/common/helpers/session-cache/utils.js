import { clone } from '@hapi/hoek'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'

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

export const clearSiteDetails = async (request, exemption, h) => {
  const updatedExemption = { ...exemption }
  delete updatedExemption.multipleSiteDetails
  delete updatedExemption.siteDetails

  request.yar.set(EXEMPTION_CACHE_KEY, updatedExemption)

  await request.yar.commit(h)

  return request.yar.get(EXEMPTION_CACHE_KEY)
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
export const resetExemptionSiteDetails = (request) => {
  const existingCache = getExemptionCache(request)
  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    multipleSiteDetails: {},
    siteDetails: []
  })
  return { siteDetails: null }
}
export const updateExemptionSiteDetailsBatch = (
  request,
  status,
  coordinateData,
  s3Location,
  options
) => {
  const { isMultipleSitesFile } = options
  const existingCache = getExemptionCache(request)

  const firstSiteDetails = getSiteDetailsBySite(existingCache)

  const { coordinatesType, fileUploadType } = firstSiteDetails

  const uploadSiteData = {
    coordinatesType,
    fileUploadType,
    uploadedFile: {
      ...status
    },
    s3Location: {
      s3Bucket: s3Location.s3Bucket,
      s3Key: s3Location.s3Key,
      fileId: status.s3Location.fileId,
      s3Url: status.s3Location.s3Url,
      checksumSha256: status.s3Location.checksumSha256
    },
    featureCount: 1,
    uploadConfig: null
  }

  if (!isMultipleSitesFile) {
    const updatedSite = {
      ...uploadSiteData,
      extractedCoordinates: coordinateData.extractedCoordinates,
      geoJSON: coordinateData.geoJSON
    }

    request.yar.set(EXEMPTION_CACHE_KEY, {
      ...existingCache,
      siteDetails: [updatedSite]
    })

    return [updatedSite]
  }

  const updatedSiteDetails = []

  for (const [index] of coordinateData.geoJSON.features.entries()) {
    const existingSiteDetails = getSiteDetailsBySite(existingCache, index)

    const updatedSite = {
      ...existingSiteDetails,
      ...uploadSiteData,
      extractedCoordinates: coordinateData.extractedCoordinates[index],
      geoJSON: {
        type: coordinateData.geoJSON.type,
        features: [coordinateData.geoJSON.features[index]]
      }
    }

    updatedSiteDetails.push(updatedSite)
  }

  request.yar.set(EXEMPTION_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })

  return updatedSiteDetails
}

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
