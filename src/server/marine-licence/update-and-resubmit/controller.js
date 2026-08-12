import Boom from '@hapi/boom'
import {
  apiRoutes,
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { clearMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

export const UPDATE_AND_RESUBMIT_VIEW_ROUTE =
  'marine-licence/update-and-resubmit/index'

const pageTitle = 'Apply again for this project'

const updateAndResubmitSettings = {
  pageTitle,
  heading: pageTitle
}

export const updateAndResubmitController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      if (marineLicence.status !== PROJECT_STATUS.REJECTED) {
        return h.redirect(routes.DASHBOARD)
      }

      const applicationRejectedLink = `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${marineLicenceId}`

      return h.view(UPDATE_AND_RESUBMIT_VIEW_ROUTE, {
        ...updateAndResubmitSettings,
        projectName: marineLicence.projectName,
        applicationReference: marineLicence.applicationReference,
        backLink: applicationRejectedLink,
        cancelLink: applicationRejectedLink
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(error, 'Error displaying update and resubmit page')
      throw Boom.internal('Error displaying update and resubmit page')
    }
  }
}

export const updateAndResubmitSubmitController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const { payload } = await authenticatedPostRequest(
        request,
        apiRoutes.COPY_MARINE_LICENCE,
        { id: marineLicenceId }
      )

      await clearMarineLicenceCache(request, h)

      const { id: newMarineLicenceId } = payload.value

      return h.redirect(
        `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}/${newMarineLicenceId}`
      )
    } catch (error) {
      request.logger.error(error, 'Error copying marine licence')
      return h.redirect(routes.DASHBOARD)
    }
  }
}
