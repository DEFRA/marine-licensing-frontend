import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { EXEMPTION_STATUS } from '#src/server/common/constants/exemptions.js'
import { routes } from '#src/server/common/constants/routes.js'
import { processSiteDetails } from '#src/server/common/helpers/exemption-site-details.js'
import { buildSiteLocationData } from '#src/server/common/helpers/site-location-data.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'
import { getAuthProvider } from '#src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'

export const VIEW_DETAILS_VIEW_ROUTE = 'exemption/view-details/index'
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
      const { multipleSiteDetails } = exemption
      const isInternalUser =
        getAuthProvider(request) === AUTH_STRATEGIES.ENTRA_ID

      const siteLocationData = buildSiteLocationData(
        multipleSiteDetails,
        exemption.siteDetails
      )

      // Format the page caption with application reference
      const pageCaption = `${exemption.applicationReference}${isInternalUser ? '' : ' - Exempt activity notification'}`

      return h.view(VIEW_DETAILS_VIEW_ROUTE, {
        pageTitle: exemption.projectName,
        pageCaption,
        backLink: isInternalUser ? null : routes.DASHBOARD,
        isReadOnly: true,
        isInternalUser,
        ...exemption,
        siteDetails,
        multipleSiteDetails,
        siteLocationData
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
