import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { routes } from '#src/server/common/constants/routes.js'
import { processSiteDetails } from '#src/server/common/helpers/exemptions/exemption-site-details.js'
import { buildSiteLocationData } from '#src/server/common/helpers/site-location-data.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'
import {
  isInternalUserView as getIsInternalUserView,
  isProjectViewable
} from '#src/server/common/helpers/view-details/utils.js'
import { EXEMPTIONS_KEY } from '#src/server/common/constants/exemptions.js'

export const VIEW_DETAILS_VIEW_ROUTE = 'exemption/view-details/index'
export const viewDetailsController = {
  async handler(request, h) {
    const { exemptionId } = request.params

    const isInternalUserView = getIsInternalUserView(request, EXEMPTIONS_KEY)

    const isPublicView = request.path.startsWith(routes.VIEW_DETAILS_PUBLIC)

    const isApplicantView = !isInternalUserView && !isPublicView

    try {
      const serviceMethod = isPublicView
        ? 'getPublicExemptionById'
        : 'getExemptionById'
      const exemptionService = getExemptionService(request)
      const exemption = await exemptionService[serviceMethod](exemptionId)

      if (!isProjectViewable(exemption)) {
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

      const siteLocationData = buildSiteLocationData(
        multipleSiteDetails,
        exemption.siteDetails
      )

      // Format the page caption with application reference
      const pageCaption = `${exemption.applicationReference}${isApplicantView ? ' - Exempt activity notification' : ''}`
      const statusTagClass = getTagStyle(exemption.status)

      return h.view(VIEW_DETAILS_VIEW_ROUTE, {
        pageTitle: exemption.projectName,
        pageCaption,
        backLink: isApplicantView ? routes.DASHBOARD : null,
        isReadOnly: true,
        isApplicantView,
        ...exemption,
        statusTagClass,
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
