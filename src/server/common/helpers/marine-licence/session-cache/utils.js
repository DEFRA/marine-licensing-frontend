import { clone } from '@hapi/hoek'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import { getSiteDetailsBySite as getSiteByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { snapshotActivityLabels } from '#src/server/common/helpers/activity-details/snapshot-activity-labels.js'
import { SINGLE_SITE_MODE_KEY } from '#src/server/common/constants/cache.js'
import {
  buildUploadSiteData,
  createSiteDetailsBatchUpdater
} from '#src/server/common/helpers/file-upload/build-uploaded-site-details.js'
import { withExtractedSiteName } from '#src/server/common/helpers/file-upload/extract-site-name.js'

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

export const getSavedSiteDetails = (request) =>
  request.yar.get(SAVED_SITE_DETAILS_CACHE_KEY) || {}

export const setSavedSiteDetails = async (request, h, values) => {
  request.yar.set(SAVED_SITE_DETAILS_CACHE_KEY, values)
  await request.yar.commit(h)
}

export const getMarineLicenceCache = (request) => {
  return clone(request.yar.get(MARINE_LICENCE_CACHE_KEY) || {})
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
  updatedActivityDetails[activityDetailsIndex] = snapshotActivityLabels({
    ...updatedActivityDetails[activityDetailsIndex],
    ...values
  })

  return updateMarineLicenceSiteDetails(
    request,
    h,
    siteIndex,
    'activityDetails',
    updatedActivityDetails
  )
}

export const updateMarineLicenceSiteDetailsMultiple = async (
  request,
  h,
  siteIndex,
  values
) => {
  const existingCache = getMarineLicenceCache(request)
  const existingSiteDetails = existingCache.siteDetails || []
  const updatedSiteDetails = [...existingSiteDetails]
  const updatedSite = { ...updatedSiteDetails[siteIndex] }

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) {
      delete updatedSite[key]
    } else {
      updatedSite[key] = value
    }
  }

  updatedSiteDetails[siteIndex] = updatedSite

  request.yar.set(MARINE_LICENCE_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })

  await request.yar.commit(h)
}

export const updateMarineLicenceSiteDetailsBatch =
  createSiteDetailsBatchUpdater({
    cacheKey: MARINE_LICENCE_CACHE_KEY,
    getCache: getMarineLicenceCache,
    getSiteDetails: getSiteDetailsBySite
  })

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

  const updatedSite = withExtractedSiteName(
    {
      ...targetSite,
      ...uploadSiteData,
      extractedCoordinates: coordinateData.extractedCoordinates,
      geoJSON: coordinateData.geoJSON
    },
    coordinateData.geoJSON.features[0],
    { preserveExisting: true }
  )

  const updatedSiteDetails = [...existingCache.siteDetails]
  updatedSiteDetails[targetSiteIndex] = updatedSite

  request.yar.set(MARINE_LICENCE_CACHE_KEY, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })
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
