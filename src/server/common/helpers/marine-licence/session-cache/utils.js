import { clone } from '@hapi/hoek'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import { getSiteDetailsBySite as getSiteByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { SINGLE_SITE_MODE_KEY } from '#src/server/common/constants/cache.js'

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

export const updateMarineLicenceSiteActivityDetails = async (
  request,
  h,
  siteIndex,
  activityDetailsIndex,
  values
) => {
  const existingCache = getMarineLicenceCache(request)
  const existingActivityDetails =
    existingCache.siteDetails[siteIndex]?.activityDetails || []

  const updatedActivityDetails = [...existingActivityDetails]
  updatedActivityDetails[activityDetailsIndex] = {
    ...updatedActivityDetails[activityDetailsIndex],
    ...values
  }

  return updateMarineLicenceSiteDetails(
    request,
    h,
    siteIndex,
    'activityDetails',
    updatedActivityDetails
  )
}

const buildUploadSiteData = ({ status, s3Location, siteDetails }) => ({
  coordinatesType: siteDetails.coordinatesType,
  fileUploadType: siteDetails.fileUploadType,
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
})

export const updateMarineLicenceSiteDetailsBatch = (
  request,
  status,
  coordinateData,
  s3Location,
  options
) => {
  const { isMultipleSitesFile } = options
  const existingCache = getMarineLicenceCache(request)

  const firstSiteDetails = getSiteDetailsBySite(existingCache)
  const uploadSiteData = buildUploadSiteData({
    status,
    s3Location,
    siteDetails: firstSiteDetails
  })

  if (!isMultipleSitesFile) {
    const updatedSite = {
      ...uploadSiteData,
      extractedCoordinates: coordinateData.extractedCoordinates,
      geoJSON: coordinateData.geoJSON
    }

    request.yar.set(MARINE_LICENCE_CACHE_KEY, {
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

  request.yar.set(MARINE_LICENCE_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })

  return updatedSiteDetails
}

export const updateSingleSiteLocation = (
  request,
  status,
  coordinateData,
  s3Location,
  targetSiteIndex
) => {
  const existingCache = getMarineLicenceCache(request)
  const targetSite = getSiteByIndex(existingCache, targetSiteIndex)
  const uploadSiteData = buildUploadSiteData({
    status,
    s3Location,
    siteDetails: targetSite
  })

  const updatedSite = {
    ...targetSite,
    ...uploadSiteData,
    extractedCoordinates: coordinateData.extractedCoordinates,
    geoJSON: coordinateData.geoJSON
  }

  const updatedSiteDetails = [...existingCache.siteDetails]
  updatedSiteDetails[targetSiteIndex] = updatedSite

  request.yar.set(MARINE_LICENCE_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })
}

export const getMarineLicenceCache = (request) => {
  return clone(request.yar.get(MARINE_LICENCE_CACHE_KEY) || {})
}

export const setSingleSiteMode = async (request, h, siteIndex) => {
  request.yar.set(SINGLE_SITE_MODE_KEY, { siteIndex })
  await request.yar.commit(h)
}

export const getSingleSiteMode = (request) =>
  request.yar.get(SINGLE_SITE_MODE_KEY) ?? null

export const clearSingleSiteMode = async (request, h) => {
  request.yar.clear(SINGLE_SITE_MODE_KEY)
  await request.yar.commit(h)
}

export const setMarineLicenceCache = async (request, h, value) => {
  const cacheValue = value || {}
  request.yar.set(MARINE_LICENCE_CACHE_KEY, cacheValue)

  await request.yar.commit(h)

  return cacheValue
}
