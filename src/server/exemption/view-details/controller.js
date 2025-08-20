import Boom from '@hapi/boom'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { createSiteDetailsDataJson } from '~/src/server/common/helpers/site-details.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  processSiteDetails,
  errorMessages as siteDetailsErrorMessages
} from '~/src/server/common/helpers/exemption-site-details.js'

const errorMessages = {
  EXEMPTION_NOT_FOUND: 'Exemption not found',
  EXEMPTION_DATA_NOT_FOUND: 'Exemption data not found',
  EXEMPTION_NOT_SUBMITTED: 'Exemption has not been submitted',
  UNAUTHORIZED_ACCESS: 'You do not have permission to view this exemption',
  ...siteDetailsErrorMessages
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
    if (error.output?.statusCode === statusCodes.forbidden) {
      request.logger.error(
        {
          id: exemptionId
        },
        errorMessages.UNAUTHORIZED_ACCESS
      )
      throw Boom.forbidden(errorMessages.UNAUTHORIZED_ACCESS)
    }

    if (error.output?.statusCode === statusCodes.notFound) {
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
      const coordinateSystem =
        exemption.siteDetails?.coordinateSystem || 'wgs84'
      const siteDetailsData = createSiteDetailsDataJson(
        siteDetails,
        coordinateSystem
      )

      // Format the page caption with application reference
      const pageCaption = `${exemption.applicationReference} - Exempt activity notification`

      return h.view(VIEW_DETAILS_VIEW_ROUTE, {
        pageTitle: 'View notification details',
        pageCaption,
        backLink: routes.DASHBOARD,
        readOnly: true,
        isReadOnly: true,
        ...exemption,
        siteDetails,
        siteDetailsData
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
