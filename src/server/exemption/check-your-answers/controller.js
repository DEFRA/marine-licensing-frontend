import Boom from '@hapi/boom'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getReviewSummaryText,
  getFileUploadSummaryData
} from '~/src/server/exemption/site-details/review-site-details/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { createSiteDetailsDataJson } from '~/src/server/common/helpers/site-details.js'
import { getCoordinateSystem } from '~/src/server/common/helpers/coordinate-utils.js'

const errorMessages = {
  EXEMPTION_NOT_FOUND: 'Exemption not found',
  EXEMPTION_DATA_NOT_FOUND: 'Exemption data not found',
  SUBMISSION_FAILED: 'Error submitting exemption',
  FILE_UPLOAD_DATA_ERROR: 'Error getting file upload summary data',
  UNEXPECTED_API_RESPONSE: 'Unexpected API response format'
}

const apiPaths = {
  getExemption: (id) => `/exemption/${id}`,
  submitExemption: '/exemption/submit'
}

const checkYourAnswersViewContent = {
  title: 'Check your answers',
  description: 'Please review your answers before submitting your application.',
  backLink: routes.TASK_LIST
}

/**
 * Validates exemption and fetches data from API
 * @param {object} request - Hapi request object
 * @param {object} exemption - Exemption data from cache
 * @returns {Promise<object>} API response payload
 */
const validateAndFetchExemption = async (request, exemption) => {
  const { id } = exemption
  if (!id) {
    request.logger.error(errorMessages.EXEMPTION_NOT_FOUND, { id })
    throw Boom.notFound(errorMessages.EXEMPTION_NOT_FOUND, { id })
  }

  const { payload } = await authenticatedGetRequest(
    request,
    apiPaths.getExemption(id)
  )

  if (!payload?.value?.taskList) {
    request.logger.error(errorMessages.EXEMPTION_DATA_NOT_FOUND, { id })
    throw Boom.notFound(
      `${errorMessages.EXEMPTION_DATA_NOT_FOUND} for id: ${id}`,
      { id }
    )
  }

  return payload
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
    request.logger.error(errorMessages.FILE_UPLOAD_DATA_ERROR, {
      error: error.message,
      exemptionId: id
    })
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
  return {
    ...exemption.siteDetails,
    isFileUpload: false,
    coordinateSystemText: getCoordinateSystemText(
      exemption.siteDetails.coordinateSystem
    ),
    coordinateDisplayText: getCoordinateDisplayText(
      exemption.siteDetails,
      exemption.siteDetails.coordinateSystem
    ),
    reviewSummaryText: getReviewSummaryText(exemption.siteDetails)
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
  } else {
    return processManualSiteDetails(exemption)
  }
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'exemption/check-your-answers/index'

/**
 * A GDS styled check your answers page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const checkYourAnswersController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { id } = exemption

    await validateAndFetchExemption(request, exemption)
    const siteDetails = processSiteDetails(exemption, id, request)
    const { coordinateSystem } = getCoordinateSystem(request)
    const siteDetailsData = createSiteDetailsDataJson(
      siteDetails,
      coordinateSystem
    )

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...exemption,
      siteDetails,
      siteDetailsData
    })
  }
}

/**
 * A GDS styled check your answers submission controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const checkYourAnswersSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { id } = exemption

    await validateAndFetchExemption(request, exemption)

    try {
      const { payload: response } = await authenticatedPostRequest(
        request,
        apiPaths.submitExemption,
        { id }
      )

      if (response?.message === 'success' && response?.value) {
        const { applicationReference } = response.value
        return h.redirect(
          `/exemption/confirmation?applicationReference=${applicationReference}`
        )
      }

      throw new Error(errorMessages.UNEXPECTED_API_RESPONSE)
    } catch (error) {
      request.logger.error(errorMessages.SUBMISSION_FAILED, {
        error: error.message,
        exemptionId: id
      })
      throw Boom.badRequest(errorMessages.SUBMISSION_FAILED, error)
    }
  }
}
