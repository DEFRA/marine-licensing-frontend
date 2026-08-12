import Boom from '@hapi/boom'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'

export const APPLICATION_REJECTED_VIEW_ROUTE =
  'marine-licence/application-rejected/index'

const pageTitle = 'We are unable to progress your application'

const applicationRejectedSettings = {
  pageTitle,
  heading: pageTitle
}

export const applicationRejectedController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      if (marineLicence.status !== PROJECT_STATUS.REJECTED) {
        return h.redirect(routes.DASHBOARD)
      }

      const { rejectedReasons, rejectedInformation } = marineLicence

      return h.view(APPLICATION_REJECTED_VIEW_ROUTE, {
        ...applicationRejectedSettings,
        marineLicenceId,
        projectName: marineLicence.projectName,
        applicationReference: marineLicence.applicationReference,
        rejectedReasons: rejectedReasons
          ? rejectedReasons.split(',')
          : rejectedReasons,
        rejectedInformation,
        viewDetailsUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`,
        updateAndResubmitUrl: `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/${marineLicenceId}`
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(error, 'Error displaying application rejected page')
      throw Boom.internal('Error displaying application rejected page')
    }
  }
}
