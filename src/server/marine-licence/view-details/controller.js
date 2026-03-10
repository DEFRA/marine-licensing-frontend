import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { routes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { isProjectViewable } from '#src/server/common/helpers/view-details/utils.js'

export const VIEW_DETAILS_VIEW_ROUTE = 'marine-licence/view-details/index'

export const viewDetailsController = {
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

      return h.view(VIEW_DETAILS_VIEW_ROUTE, {
        pageTitle: marineLicence.projectName,
        pageCaption: `${marineLicence.applicationReference} - Marine licence`,
        backLink: routes.DASHBOARD
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
