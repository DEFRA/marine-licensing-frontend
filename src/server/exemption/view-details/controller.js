import Boom from '@hapi/boom'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getReviewSummaryText,
  getFileUploadSummaryData,
  getPolygonCoordinatesDisplayData
} from '~/src/server/exemption/site-details/review-site-details/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'

const errorMessages = {
  EXEMPTION_NOT_FOUND: 'Exemption not found',
  EXEMPTION_DATA_NOT_FOUND: 'Exemption data not found',
  EXEMPTION_NOT_SUBMITTED: 'Exemption has not been submitted',
  FILE_UPLOAD_DATA_ERROR: 'Error getting file upload summary data',
  UNAUTHORIZED_ACCESS: 'You do not have permission to view this exemption'
}

const apiPaths = {
  getExemption: (id) => `/exemption/${id}`
}

/**
 * Validates exemption and fetches data from API
 * @param {object} request - Hapi request object
 * @param {string} exemptionId - Exemption ID from route params
 * @returns {Promise<object>} API response payload
 */
const validateAndFetchExemption = async (request, exemptionId) => {
  if (!exemptionId) {
    request.logger.error({ id: exemptionId }, errorMessages.EXEMPTION_NOT_FOUND)
    throw Boom.notFound(errorMessages.EXEMPTION_NOT_FOUND)
  }

  try {
    const response = await authenticatedGetRequest(
      request,
      apiPaths.getExemption(exemptionId)
    )

    const { payload } = response

    if (!payload?.value) {
      request.logger.error(
        {
          id: exemptionId
        },
        errorMessages.EXEMPTION_DATA_NOT_FOUND
      )
      throw Boom.notFound(errorMessages.EXEMPTION_DATA_NOT_FOUND)
    }

    const exemption = payload.value

    if (exemption.status === 'Draft' || !exemption.applicationReference) {
      request.logger.error(
        {
          id: exemptionId,
          status: exemption.status,
          hasApplicationReference: !!exemption.applicationReference
        },
        errorMessages.EXEMPTION_NOT_SUBMITTED
      )

      throw Boom.forbidden(errorMessages.EXEMPTION_NOT_SUBMITTED)
    }

    return payload
  } catch (error) {
    if (error.isBoom) {
      throw error
    }

    request.logger.error(
      {
        exemptionId,
        message: error.message,
        statusCode: error.output?.statusCode || error.statusCode
      },
      'Error in API request'
    )

    // Handle potential authorization errors from API
    if (error.output?.statusCode === 403) {
      request.logger.error(
        {
          id: exemptionId
        },
        errorMessages.UNAUTHORIZED_ACCESS
      )
      throw Boom.forbidden(errorMessages.UNAUTHORIZED_ACCESS)
    }

    if (error.output?.statusCode === 404) {
      request.logger.error(
        {
          id: exemptionId
        },
        errorMessages.EXEMPTION_NOT_FOUND
      )
      throw Boom.notFound(errorMessages.EXEMPTION_NOT_FOUND)
    }

    request.logger.error(
      { error: error.message },
      'Unexpected error fetching exemption'
    )
    throw Boom.internal('Error retrieving exemption details')
  }
}

/**
 * Processes file upload site details with error handling
 * @param {object} exemption - Exemption data
 * @param {string} id - Exemption ID
 * @param {object} request - Hapi request object
 * @returns {object} Processed site details for file upload
 */
const processFileUploadSiteDetails = (exemption, id, request) => {
  try {
    const fileUploadData = getFileUploadSummaryData(exemption)
    return {
      ...exemption.siteDetails,
      isFileUpload: true,
      method: fileUploadData.method,
      fileType: fileUploadData.fileType,
      filename: fileUploadData.filename
    }
  } catch (error) {
    request.logger.error(
      {
        error: error.message,
        exemptionId: id
      },
      errorMessages.FILE_UPLOAD_DATA_ERROR
    )
    // Fallback to basic site details if file upload data unavailable
    return {
      ...exemption.siteDetails,
      isFileUpload: true,
      method: 'Upload a file with the coordinates of the site',
      fileType:
        exemption.siteDetails.fileUploadType === 'kml' ? 'KML' : 'Shapefile',
      filename: exemption.siteDetails.uploadedFile?.filename || 'Unknown file'
    }
  }
}

/**
 * Processes manual coordinate site details
 * @param {object} exemption - Exemption data
 * @returns {object} Processed site details for manual coordinates
 */
const processManualSiteDetails = (exemption) => {
  const { siteDetails } = exemption
  const { coordinateSystem, coordinatesEntry } = siteDetails

  const baseData = {
    isFileUpload: false,
    coordinateSystemText: getCoordinateSystemText(coordinateSystem),
    reviewSummaryText: getReviewSummaryText(siteDetails)
  }

  // Handle polygon sites (multiple coordinates)
  if (coordinatesEntry === 'multiple') {
    return {
      ...baseData,
      isPolygonSite: true,
      polygonCoordinates: getPolygonCoordinatesDisplayData(
        siteDetails,
        coordinateSystem
      )
    }
  }

  // Handle circular sites (single coordinate + width)
  return {
    ...baseData,
    isPolygonSite: false,
    coordinateDisplayText: getCoordinateDisplayText(
      siteDetails,
      coordinateSystem
    ),
    circleWidth: siteDetails.circleWidth
  }
}

/**
 * Processes site details based on coordinates type
 * @param {object} exemption - Exemption data
 * @param {string} id - Exemption ID
 * @param {object} request - Hapi request object
 * @returns {object|null} Processed site details or null
 */
const processSiteDetails = (exemption, id, request) => {
  if (!exemption.siteDetails) {
    return null
  }

  const { coordinatesType } = exemption.siteDetails

  if (coordinatesType === 'file') {
    return processFileUploadSiteDetails(exemption, id, request)
  }

  return processManualSiteDetails(exemption)
}

export const VIEW_DETAILS_VIEW_ROUTE = 'exemption/view-details/index'

/**
 * View details controller for displaying read-only exemption details
 * @satisfies {Partial<ServerRoute>}
 */
export const viewDetailsController = {
  async handler(request, h) {
    const { exemptionId } = request.params

    try {
      const payload = await validateAndFetchExemption(request, exemptionId)
      const exemption = payload.value

      const siteDetails = processSiteDetails(exemption, exemptionId, request)

      // Format the page caption with application reference
      const pageCaption = `${exemption.applicationReference} - Exempt activity notification`

      return h.view(VIEW_DETAILS_VIEW_ROUTE, {
        pageTitle: 'View notification details',
        pageCaption,
        backLink: routes.DASHBOARD,
        readOnly: true,
        ...exemption,
        siteDetails
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(
        {
          message: error.message,
          exemptionId
        },
        'Error displaying exemption details'
      )
      throw Boom.internal('Error displaying exemption details')
    }
  }
}
