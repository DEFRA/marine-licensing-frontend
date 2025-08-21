import Boom from '@hapi/boom'
import { routes } from '~/src/server/common/constants/routes.js'
import { createSiteDetailsDataJson } from '~/src/server/common/helpers/site-details.js'
import { processSiteDetails } from '~/src/server/common/helpers/exemption-site-details.js'
import { errorMessages } from '~/src/server/common/constants/error-messages.js'
import { getExemptionService } from '~/src/services/exemption-service/index.js'
import { EXEMPTION_STATUS } from '~/src/server/common/constants/exemptions.js'

export const VIEW_DETAILS_VIEW_ROUTE = 'exemption/view-details/index'

/**
 * View details controller for displaying read-only exemption details
 * @satisfies {Partial<ServerRoute>}
 */
export const viewDetailsController = {
  async handler(request, h) {
    const { exemptionId } = request.params

    try {
      const exemptionService = getExemptionService(request)
      const exemption = await exemptionService.getExemptionById(exemptionId)

      if (
        exemption.status === EXEMPTION_STATUS.DRAFT ||
        !exemption.applicationReference
      ) {
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

      const siteDetails = processSiteDetails(exemption, exemptionId, request)
      const coordinateSystem = exemption.siteDetails?.coordinateSystem
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
        isReadOnly: true,
        ...exemption,
        siteDetails,
        siteDetailsData
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(error, 'Error displaying exemption details')
      throw Boom.internal('Error displaying exemption details')
    }
  }
}
