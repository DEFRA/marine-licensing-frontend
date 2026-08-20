import { withExtractedSiteName } from '#src/server/common/helpers/file-upload/extract-site-name.js'

export const buildUploadSiteData = ({ status, s3Location, siteDetails }) => ({
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

const buildSingleUploadedSite = (uploadSiteData, coordinateData) =>
  withExtractedSiteName(
    {
      ...uploadSiteData,
      extractedCoordinates: coordinateData.extractedCoordinates,
      geoJSON: coordinateData.geoJSON
    },
    coordinateData.geoJSON.features[0]
  )

const buildMultipleUploadedSites = (
  existingCache,
  uploadSiteData,
  coordinateData,
  getSiteDetails
) =>
  coordinateData.geoJSON.features.map((feature, index) =>
    withExtractedSiteName(
      {
        ...getSiteDetails(existingCache, index),
        ...uploadSiteData,
        extractedCoordinates: coordinateData.extractedCoordinates[index],
        geoJSON: {
          type: coordinateData.geoJSON.type,
          features: [feature]
        }
      },
      feature
    )
  )

export const buildUploadedSiteDetails = ({
  existingCache,
  uploadSiteData,
  coordinateData,
  isMultipleSitesFile,
  getSiteDetails
}) => {
  if (!isMultipleSitesFile) {
    return [buildSingleUploadedSite(uploadSiteData, coordinateData)]
  }

  return buildMultipleUploadedSites(
    existingCache,
    uploadSiteData,
    coordinateData,
    getSiteDetails
  )
}

export const updateCachedSiteDetailsBatch = (
  request,
  status,
  coordinateData,
  s3Location,
  { isMultipleSitesFile, cacheKey, getCache, getSiteDetails }
) => {
  const existingCache = getCache(request)
  const updatedSiteDetails = buildUploadedSiteDetails({
    existingCache,
    uploadSiteData: buildUploadSiteData({
      status,
      s3Location,
      siteDetails: getSiteDetails(existingCache)
    }),
    coordinateData,
    isMultipleSitesFile,
    getSiteDetails
  })

  request.yar.set(cacheKey, {
    ...existingCache,
    siteDetails: updatedSiteDetails
  })

  return updatedSiteDetails
}

export const createSiteDetailsBatchUpdater =
  ({ cacheKey, getCache, getSiteDetails }) =>
  (request, status, coordinateData, s3Location, options) =>
    updateCachedSiteDetailsBatch(request, status, coordinateData, s3Location, {
      ...options,
      cacheKey,
      getCache,
      getSiteDetails
    })
