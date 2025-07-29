import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { getCoordinateSystem } from '~/src/server/common/helpers/session-cache/utils.js'
import Boom from '@hapi/boom'
import { config } from '~/src/config/config.js'

const REVIEW_SITE_DETAILS_VIEW_ROUTE =
  'exemption/site-details/review-site-details/index'

const FILE_UPLOAD_REVIEW_VIEW_ROUTE =
  'exemption/site-details/review-site-details/file-upload-review'

export const getSiteDetailsBackLink = (previousPage) => {
  if (!previousPage || !URL.canParse(previousPage)) {
    return routes.TASK_LIST
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  return routes.WIDTH_OF_SITE
}

export const getReviewSummaryText = (siteDetails) => {
  const { coordinatesEntry, coordinatesType } = siteDetails

  if (coordinatesEntry === 'single' && coordinatesType === 'coordinates') {
    return 'Manually enter one set of coordinates and a width to create a circular site'
  }

  return ''
}

export const getCoordinateSystemText = (coordinateSystem) => {
  if (!coordinateSystem) {
    return ''
  }

  return coordinateSystem === COORDINATE_SYSTEMS.WGS84
    ? 'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
    : 'OSGB36 (National Grid)\nEastings and Northings'
}

export const getCoordinateDisplayText = (siteDetails, coordinateSystem) => {
  const { coordinates } = siteDetails

  if (!coordinates || !coordinateSystem) {
    return ''
  }

  return coordinateSystem === COORDINATE_SYSTEMS.WGS84
    ? `${coordinates.latitude}, ${coordinates.longitude}`
    : `${coordinates.eastings}, ${coordinates.northings}`
}

export const getFileUploadSummaryData = (exemption) => {
  const siteDetails = exemption.siteDetails || {}
  const uploadedFile = siteDetails.uploadedFile || {}
  const geoJSON = siteDetails.geoJSON || {}

  // Parse coordinates from geoJSON, only including features with valid geometry
  let coordinates = []
  if (geoJSON.features && Array.isArray(geoJSON.features)) {
    coordinates = geoJSON.features
      .filter(
        (feature) =>
          feature.geometry?.type &&
          feature.geometry?.coordinates &&
          Array.isArray(feature.geometry.coordinates) &&
          feature.geometry.coordinates.length > 0
      )
      .map((feature) => ({
        type: feature.geometry.type,
        coordinates: feature.geometry.coordinates
      }))
  }

  // Determine file type display text
  let fileTypeText = ''
  if (siteDetails.fileUploadType === 'kml') {
    fileTypeText = 'KML'
  } else if (siteDetails.fileUploadType === 'shapefile') {
    fileTypeText = 'Shapefile'
  } else {
    throw new Error('Unsupported file type for site details')
  }

  return {
    method: 'Upload a file with the coordinates of the site',
    fileType: fileTypeText,
    filename: uploadedFile.filename,
    coordinates,
    geoJSON
  }
}

export const getFileUploadBackLink = (previousPage) => {
  if (!previousPage || !URL.canParse(previousPage)) {
    return routes.FILE_UPLOAD
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  // If coming from task list, return to task list
  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  // Otherwise, return to file upload page
  return routes.FILE_UPLOAD
}

/**
 * Builds summary data for manual coordinate entry display
 * @param {object} siteDetails - Site details from exemption
 * @param {string} coordinateSystem - Selected coordinate system
 * @returns {object} Summary data for template
 */
export const buildManualCoordinateSummaryData = (
  siteDetails,
  coordinateSystem
) => {
  const { circleWidth } = siteDetails

  return {
    method: getReviewSummaryText(siteDetails),
    coordinateSystem: getCoordinateSystemText(coordinateSystem),
    coordinates: getCoordinateDisplayText(siteDetails, coordinateSystem),
    width: circleWidth ? `${circleWidth} metres` : ''
  }
}

/**
 * Loads site details from DB when session data is incomplete
 * @param {object} request - Hapi request object
 * @param {object} exemption - Current exemption from session
 * @param {Function} authenticatedGetRequest - Function to make authenticated API calls
 * @returns {Promise<object>} Site details object
 */
export const getSiteDetails = async (
  request,
  exemption,
  authenticatedGetRequest
) => {
  let siteDetails = exemption.siteDetails ?? {}

  // If we have an exemption ID but incomplete site details, load from DB
  if (exemption.id && exemption.siteDetails === undefined) {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `/exemption/${exemption.id}`
      )
      if (payload?.value?.siteDetails) {
        siteDetails = payload.value.siteDetails
        request.logger.info('Loaded site details from MongoDB for display', {
          exemptionId: exemption.id,
          coordinatesType: siteDetails.coordinatesType
        })
      } else {
        request.logger.warn('No site details found in MongoDB response', {
          exemptionId: exemption.id
        })
        // Continue with session data when no site details found
      }
    } catch (error) {
      request.logger.error('Failed to load exemption data from MongoDB', {
        error: error.message,
        exemptionId: exemption.id
      })
    }
  }

  return siteDetails
}

/**
 * Prepares file upload data for saving to MongoDB
 * @param {object} siteDetails - Site details from exemption
 * @param {object} request - Hapi request object for logging
 * @returns {object} Formatted data for API submission
 */
export const prepareFileUploadDataForSave = (siteDetails, request) => {
  const uploadedFile = siteDetails.uploadedFile
  const geoJSON = siteDetails.geoJSON
  const featureCount = siteDetails.featureCount || 0

  const dataToSave = {
    coordinatesType: 'file',
    fileUploadType: siteDetails.fileUploadType,
    geoJSON,
    featureCount,
    uploadedFile: {
      filename: uploadedFile.filename // Save filename for display
    },
    s3Location: {
      s3Bucket: uploadedFile.s3Location.s3Bucket,
      s3Key: uploadedFile.s3Location.s3Key,
      checksumSha256: uploadedFile.s3Location.checksumSha256
    }
  }

  request.logger.info('Saving file upload site details', {
    fileType: siteDetails.fileUploadType,
    featureCount,
    filename: uploadedFile.filename
  })

  return dataToSave
}

/**
 * Prepares manual coordinate data for saving to MongoDB
 * @param {object} exemption - Current exemption from session
 * @param {object} request - Hapi request object for logging
 * @returns {object} Formatted data for API submission
 */
export const prepareManualCoordinateDataForSave = (exemption, request) => {
  const siteDetails = exemption.siteDetails

  request.logger.info('Saving manual coordinate site details', {
    coordinatesType: siteDetails.coordinatesType,
    coordinatesEntry: siteDetails.coordinatesEntry
  })

  // Manual coordinate entry flow - use existing data structure
  return exemption.siteDetails
}

/**
 * Handles file upload review view rendering
 * @param {object} h - Hapi response toolkit
 * @param {object} exemption - Current exemption from session
 * @param {object} siteDetails - Site details object
 * @param {string} previousPage - Previous page URL for back link
 * @param {object} reviewSiteDetailsPageData - Common page data
 * @returns {object} Rendered view response
 */
export const renderFileUploadReview = (
  h,
  exemption,
  siteDetails,
  previousPage,
  reviewSiteDetailsPageData
) => {
  const fileUploadSummaryData = getFileUploadSummaryData({
    ...exemption,
    siteDetails
  })

  return h.view(FILE_UPLOAD_REVIEW_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getFileUploadBackLink(previousPage),
    projectName: exemption.projectName,
    fileUploadSummaryData,
    configEnv: config.get('env')
  })
}

/**
 * Handles manual coordinate review view rendering
 * @param {object} h - Hapi response toolkit
 * @param {object} request - Hapi request object
 * @param {object} exemption - Current exemption from session
 * @param {object} siteDetails - Site details object
 * @param {string} previousPage - Previous page URL for back link
 * @param {object} reviewSiteDetailsPageData - Common page data
 * @returns {object} Rendered view response
 */
export const renderManualCoordinateReview = (
  h,
  request,
  exemption,
  siteDetails,
  previousPage,
  reviewSiteDetailsPageData
) => {
  const { coordinateSystem } = getCoordinateSystem(request)
  const summaryData = buildManualCoordinateSummaryData(
    siteDetails,
    coordinateSystem
  )

  return h.view(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getSiteDetailsBackLink(previousPage),
    projectName: exemption.projectName,
    summaryData
  })
}

/**
 * Handles errors during site details submission
 * @param {object} request - Hapi request object
 * @param {Error} error - The error that occurred
 * @param {string} exemptionId - ID of the exemption
 * @param {string} coordinatesType - Type of coordinates being saved
 * @returns {Boom} Standardized error response
 */
export const handleSubmissionError = (
  request,
  error,
  exemptionId,
  coordinatesType
) => {
  request.logger.error('Error submitting site review', {
    error: error.message,
    exemptionId,
    coordinatesType
  })
  return Boom.badRequest('Error submitting site review', error)
}
