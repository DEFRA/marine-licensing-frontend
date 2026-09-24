import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { isProjectViewable } from '#src/server/common/helpers/view-details/utils.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'
import { buildApplicationDetailsCardData } from '#src/server/marine-licence/view-details/utils.js'
import {
  buildRedactedMarinePlanPolicies,
  buildRedactedOtherPermissions,
  buildRedactedPreviewProjectDetails,
  buildRedactedSiteDetails,
  buildRedactedWaterFrameworkDirectiveData
} from '#src/server/marine-licence/view-marine-licence-internal-user/preview-project-details.js'

export const PREVIEW_VIEW_ROUTE =
  'marine-licence/view-marine-licence-internal-user/preview'

export const previewController = {
  async handler(request, h) {
    const { applicationReference } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence =
        await service.getMarineLicenceByReference(applicationReference)

      if (!isProjectViewable(marineLicence)) {
        throw Boom.forbidden(errorMessages.MARINE_LICENCE_NOT_SUBMITTED)
      }

      const summaryData = buildSummaryData(marineLicence)

      const projectDetails = buildRedactedPreviewProjectDetails(summaryData)
      const siteData = buildRedactedSiteDetails(summaryData)
      const otherPermissions = buildRedactedOtherPermissions(summaryData)
      const marinePlanPolicies = buildRedactedMarinePlanPolicies(marineLicence)
      const waterFrameworkDirectiveData =
        buildRedactedWaterFrameworkDirectiveData(marineLicence)

      return h.view(PREVIEW_VIEW_ROUTE, {
        pageCaption: marineLicence.applicationReference,
        isReadOnly: true,
        ...projectDetails,
        ...otherPermissions,
        ...buildApplicationDetailsCardData(marineLicence),
        siteData,
        marinePlanPolicies,
        waterFrameworkDirectiveData,
        redactions: marineLicence.redactions
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(error, 'Error displaying marine licence preview')
      throw Boom.internal('Error displaying marine licence preview')
    }
  }
}
