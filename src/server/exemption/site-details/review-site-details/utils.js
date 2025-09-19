import Boom from '@hapi/boom'
import { config } from '~/src/config/config.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { getCoordinateSystem } from '~/src/server/common/helpers/coordinate-utils.js'
import { createSiteDetailsDataJson } from '~/src/server/common/helpers/site-details.js'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-details-utils.js'
const isWGS84 = (coordinateSystem) =>
  coordinateSystem === COORDINATE_SYSTEMS.WGS84

const isValidPolygonInput = (siteDetails, coordinateSystem) => {
  if (!siteDetails || !coordinateSystem) {
    return false
  }

  const { coordinates } = siteDetails
  return coordinates && Array.isArray(coordinates)
}

const isValidCoordinateForSystem = (coord, coordinateSystem) => {
  if (!coord) {
    return false
  }

  if (isWGS84(coordinateSystem)) {
    return coord.latitude && coord.longitude
  }

  return coord.eastings && coord.northings
}

const generateCoordinateLabel = (index) => {
  return index === 0 ? 'Start and end points' : `Point ${index + 1}`
}

const transformCoordinateToDisplayFormat = (coord, index, coordinateSystem) => {
  const displayText = getCoordinateDisplayText(
    { coordinates: coord },
    coordinateSystem
  )

  return {
    label: generateCoordinateLabel(index),
    value: displayText
  }
}

const REVIEW_SITE_DETAILS_VIEW_ROUTE =
  'exemption/site-details/review-site-details/index'

const FILE_UPLOAD_REVIEW_VIEW_ROUTE =
  'exemption/site-details/review-site-details/file-upload-review'

export const getSiteDetailsBackLink = (previousPage, coordinatesEntry) => {
  if (!previousPage || !URL.canParse(previousPage)) {
    return routes.TASK_LIST
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  if (coordinatesEntry === 'multiple') {
    return routes.ENTER_MULTIPLE_COORDINATES
  }

  // For circular sites (single coordinate), go back to width page
  return routes.WIDTH_OF_SITE
}

export const getReviewSummaryText = (siteDetails) => {
  const { coordinatesEntry, coordinatesType } = siteDetails

  if (coordinatesEntry === 'single' && coordinatesType === 'coordinates') {
    return 'Manually enter one set of coordinates and a width to create a circular site'
  }

  if (coordinatesEntry === 'multiple' && coordinatesType === 'coordinates') {
    return 'Manually enter multiple sets of coordinates to mark the boundary of the site'
  }

  return ''
}

export const getCoordinateSystemText = (coordinateSystem) => {
  if (!coordinateSystem) {
    return ''
  }

  return isWGS84(coordinateSystem)
    ? 'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
    : 'OSGB36 (National Grid)\nEastings and Northings'
}

export const getCoordinateDisplayText = (siteDetails, coordinateSystem) => {
  const { coordinates } = siteDetails

  if (!coordinates || !coordinateSystem) {
    return ''
  }

  return isWGS84(coordinateSystem)
    ? `${coordinates.latitude}, ${coordinates.longitude}`
    : `${coordinates.eastings}, ${coordinates.northings}`
}

export const getPolygonCoordinatesDisplayData = (
  siteDetails,
  coordinateSystem
) => {
  if (!isValidPolygonInput(siteDetails, coordinateSystem)) {
    return []
  }

  const { coordinates } = siteDetails

  const validCoordinates = coordinates.filter((coord) =>
    isValidCoordinateForSystem(coord, coordinateSystem)
  )

  return validCoordinates.map((coord, index) =>
    transformCoordinateToDisplayFormat(coord, index, coordinateSystem)
  )
}

export const getFileUploadSummaryData = (exemption) => {
  const siteDetails = exemption.siteDetails || {}
  const uploadedFile = siteDetails.uploadedFile || {}
  const geoJSON = siteDetails.geoJSON || {}

  const coordinates = parseGeoJSONCoordinates(geoJSON)
  const fileType = getFileTypeText(siteDetails.fileUploadType)

  return {
    method: 'Upload a file with the coordinates of the site',
    fileType,
    filename: uploadedFile.filename,
    coordinates,
    geoJSON
  }
}

const parseGeoJSONCoordinates = (geoJSON) => {
  const features = geoJSON.features
  if (!features || !Array.isArray(features)) {
    return []
  }

  return features.filter(hasValidGeometry).map(extractCoordinateData)
}

const hasValidGeometry = (feature) => {
  const geometry = feature.geometry
  return (
    geometry?.type &&
    geometry?.coordinates &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0
  )
}

const extractCoordinateData = (feature) => ({
  type: feature.geometry.type,
  coordinates: feature.geometry.coordinates
})

const getFileTypeText = (fileUploadType) => {
  const typeMap = { kml: 'KML', shapefile: 'Shapefile' }
  const fileType = typeMap[fileUploadType]

  if (!fileType) {
    throw new Error('Unsupported file type for site details')
  }

  return fileType
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

const metresLabel = (metres) =>
  metres === '1' ? `${metres} metre` : `${metres} metres`

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
  const { circleWidth, coordinatesEntry } = siteDetails

  if (coordinatesEntry === 'multiple') {
    return {
      method: getReviewSummaryText(siteDetails),
      coordinateSystem: getCoordinateSystemText(coordinateSystem),
      polygonCoordinates: getPolygonCoordinatesDisplayData(
        siteDetails,
        coordinateSystem
      )
    }
  }

  // Default to circular site display
  return {
    method: getReviewSummaryText(siteDetails),
    coordinateSystem: getCoordinateSystemText(coordinateSystem),
    coordinates: getCoordinateDisplayText(siteDetails, coordinateSystem),
    width: circleWidth ? metresLabel(circleWidth) : ''
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
  let siteDetails = getSiteDetailsBySite(exemption)

  // If we have an exemption ID but incomplete site details, load from DB
  if (exemption.id && exemption.siteDetails === undefined) {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `/exemption/${exemption.id}`
      )
      if (payload?.value?.siteDetails) {
        siteDetails = payload.value.siteDetails[0]
        request.logger.info(
          {
            exemptionId: exemption.id,
            coordinatesType: siteDetails.coordinatesType
          },
          'Loaded site details from MongoDB for display'
        )
      } else {
        request.logger.warn(
          {
            exemptionId: exemption.id
          },
          'No site details found in MongoDB response'
        )
        // Continue with session data when no site details found
      }
    } catch (error) {
      request.logger.error(
        {
          error: error.message,
          exemptionId: exemption.id
        },
        'Failed to load exemption data from MongoDB'
      )
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
  const dataToSave = []
  for (const site of siteDetails) {
    const uploadedFile = site.uploadedFile
    const geoJSON = site.geoJSON
    const featureCount = site.featureCount || 0

    const siteToSave = {
      coordinatesType: 'file',
      fileUploadType: site.fileUploadType,
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

    request.logger.info(
      {
        fileType: site.fileUploadType,
        featureCount,
        filename: uploadedFile.filename
      },
      'Saving file upload site details'
    )

    dataToSave.push(siteToSave)
  }

  return dataToSave
}

/**
 * Prepares manual coordinate data for saving to MongoDB
 * @param {object} exemption - Current exemption from session
 * @param {object} request - Hapi request object for logging
 * @returns {object} Formatted data for API submission
 */
export const prepareManualCoordinateDataForSave = (exemption, request) => {
  for (const site of exemption.siteDetails) {
    request.logger.info(
      {
        coordinatesType: site.coordinatesType,
        coordinatesEntry: site.coordinatesEntry
      },
      'Saving manual coordinate site details'
    )
  }

  // Manual coordinate entry flow - use existing data structure
  return exemption.siteDetails
}

/**
 * Handles file upload review view rendering
 * @param {object} h - Hapi response toolkit
 * @param {object} options - Rendering options
 * @param {object} options.exemption - Current exemption from session
 * @param {object} options.siteDetails - Site details object
 * @param {string} options.previousPage - Previous page URL for back link
 * @param {object} options.reviewSiteDetailsPageData - Common page data
 * @returns {object} Rendered view response
 */
export const renderFileUploadReview = (h, options) => {
  const { exemption, previousPage, siteDetails, reviewSiteDetailsPageData } =
    options
  const { multipleSiteDetails } = exemption

  const fileUploadSummaryData = getFileUploadSummaryData({
    ...exemption,
    siteDetails
  })

  // Prepare site details data for map if needed
  const siteDetailsData = createSiteDetailsDataJson(siteDetails)

  return h.view(FILE_UPLOAD_REVIEW_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getFileUploadBackLink(previousPage),
    projectName: exemption.projectName,
    fileUploadSummaryData,
    siteDetailsData,
    configEnv: config.get('env'),
    isMultiSiteJourney: !!multipleSiteDetails?.multipleSitesEnabled
  })
}

/**
 * Handles manual coordinate review view rendering
 * @param {object} h - Hapi response toolkit
 * @param {object} request - Hapi request object
 * @param {object} options - Rendering options
 * @param {object} options.exemption - Current exemption from session
 * @param {object} options.siteDetails - Site details object
 * @param {string} options.previousPage - Previous page URL for back link
 * @param {object} options.reviewSiteDetailsPageData - Common page data
 * @returns {object} Rendered view response
 */
export const renderManualCoordinateReview = (h, request, options) => {
  const { exemption, previousPage, siteDetails, reviewSiteDetailsPageData } =
    options
  const { multipleSiteDetails } = exemption

  const { coordinateSystem } = getCoordinateSystem(request)
  const summaryData = buildManualCoordinateSummaryData(
    siteDetails,
    coordinateSystem
  )

  // Prepare site details data for map if needed
  const siteDetailsData = createSiteDetailsDataJson(
    siteDetails,
    coordinateSystem
  )

  return h.view(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getSiteDetailsBackLink(
      previousPage,
      siteDetails.coordinatesEntry
    ),
    projectName: exemption.projectName,
    summaryData,
    siteDetailsData,
    isMultiSiteJourney: !!multipleSiteDetails?.multipleSitesEnabled
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
  request.logger.error(
    {
      error: error.message,
      exemptionId,
      coordinatesType
    },
    'Error submitting site review'
  )
  return Boom.badRequest('Error submitting site review', error)
}
