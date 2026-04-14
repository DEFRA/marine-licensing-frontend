import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  isInternalUserView as getIsInternalUserView,
  isProjectViewable
} from '#src/server/common/helpers/view-details/utils.js'
import { MARINE_LICENCE_KEY } from '#src/server/common/constants/marine-licence.js'

export const VIEW_DETAILS_VIEW_ROUTE = 'marine-licence/view-details/index'

export const viewDetailsController = {
  async handler(request, h) {
    const { marineLicenceId } = request.params

    const isInternalUserView = getIsInternalUserView(
      request,
      MARINE_LICENCE_KEY
    )

    const isPublicView = request.path.startsWith(
      marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC
    )

    const isApplicantView = !isInternalUserView && !isPublicView

    try {
      const service = getMarineLicenceService(request)
      const serviceMethod = isPublicView
        ? 'getPublicMarineLicenceById'
        : 'getMarineLicenceById'
      const marineLicence = await service[serviceMethod](marineLicenceId)

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

      const pageCaption = isApplicantView
        ? `${marineLicence.applicationReference} - Marine licence`
        : marineLicence.applicationReference

      return h.view(VIEW_DETAILS_VIEW_ROUTE, {
        pageTitle: marineLicence.projectName,
        specialLegalPowers: marineLicence.specialLegalPowers,
        publicRegister: marineLicence.publicRegister,
        otherAuthorities: marineLicence.otherAuthorities,
        projectName: marineLicence.projectName,
        projectBackground: marineLicence.projectBackground,
        isReadOnly: true,
        pageCaption,
        backLink: isApplicantView ? routes.DASHBOARD : null
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
