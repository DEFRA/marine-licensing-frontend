import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { isProjectViewable } from '#src/server/common/helpers/view-details/utils.js'

export const VIEW_DETAILS_VIEW_ROUTE = 'marine-licence/view-details/index'

export const viewDetailsController = {
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const isPublicView = request.path.startsWith(
      marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC
    )

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

      const pageCaption = isPublicView
        ? marineLicence.applicationReference
        : `${marineLicence.applicationReference} - Marine licence`

      return h.view(VIEW_DETAILS_VIEW_ROUTE, {
        pageTitle: marineLicence.projectName,
        pageCaption,
        backLink: isPublicView ? null : routes.DASHBOARD
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
