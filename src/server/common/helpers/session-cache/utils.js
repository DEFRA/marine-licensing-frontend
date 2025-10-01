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
 * @param { Request } request - Hapi request object
 * @param { object } status - Upload status response from CDP
 * @param { object } coordinateData - Extracted coordinate data
 * @param { object } s3Location - S3 location details
 * @param { object } options - Configuration options
 * @param { boolean } options.isMultipleSitesFile - Is the upload for multiple sites
 */
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
