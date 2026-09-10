import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { isProjectViewable } from '#src/server/common/helpers/view-details/utils.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { waterFrameworkReviewData } from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
import {
  buildApplicationDetailsCardData,
  buildRedactionsForView
} from '#src/server/marine-licence/view-details/utils.js'

export const VIEW_DETAILS_INTERNAL_USER_VIEW_ROUTE =
  'marine-licence/view-marine-licence-internal-user/index'

const PAGE_TITLE = 'Redact application for the public register'

const getRedactionSaveUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${marineLicenceId}/redact`

export const viewDetailsInternalUserController = {
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      if (!isProjectViewable(marineLicence)) {
        request.logger.error(
          {
            id: marineLicenceId,
            status: marineLicence.status,
            hasApplicationReference: !!marineLicence.applicationReference
          },
          errorMessages.MARINE_LICENCE_NOT_SUBMITTED
        )
        throw Boom.forbidden(errorMessages.MARINE_LICENCE_NOT_SUBMITTED)
      }

      const formattedMarineLicence = buildSummaryData(marineLicence)
      const { coordinatesType, summaryData } = buildSiteData(marineLicence)

      const waterFrameworkDirectiveData = waterFrameworkReviewData(
        formattedMarineLicence.waterFrameworkDirective
      )

      const marinePlanPolicies = buildMarinePlanPoliciesData(marineLicence)

      const applicationDetailsCardData =
        buildApplicationDetailsCardData(marineLicence)

      return h.view(VIEW_DETAILS_INTERNAL_USER_VIEW_ROUTE, {
        pageTitle: PAGE_TITLE,
        specialLegalPowers: formattedMarineLicence.specialLegalPowers,
        harbourAuthority: formattedMarineLicence.harbourAuthority,
        otherAuthorities: formattedMarineLicence.otherAuthorities,
        preferredDates: formattedMarineLicence.preferredDates,
        redactions: buildRedactionsForView(formattedMarineLicence.redactions),
        projectName: formattedMarineLicence.projectName,
        projectBackground: formattedMarineLicence.projectBackground,
        publicConsultation: formattedMarineLicence.publicConsultation,
        coordinatesType,
        summaryData,
        isReadOnly: true,
        pageCaption: `${marineLicence.applicationReference} - ${formattedMarineLicence.projectName}`,
        backLink: null,
        marineLicenceId,
        redactionSaveUrl: getRedactionSaveUrl(marineLicenceId),
        csrfToken: request.plugins.crumb,
        waterFrameworkDirectiveData,
        marinePlanPolicies,
        ...applicationDetailsCardData
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(error, 'Error displaying marine licence details')
      throw Boom.internal('Error displaying marine licence details')
    }
  }
}
