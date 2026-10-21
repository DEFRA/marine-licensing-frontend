import Boom from '@hapi/boom'
import joi from 'joi'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { resolveApplicationTask } from '#src/server/common/helpers/marine-licence/application-tasks/resolve.js'
import {
  marineLicenceIdSchema,
  taskIdSchema,
  validateMarineLicenceIdParams
} from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import {
  getViewDetailsUrl,
  assertIsOriginalSubmitter
} from '#src/server/common/helpers/view-details/utils.js'
import {
  WITHHOLDING_NOTIFICATION_PAGE_TITLE,
  WITHHOLDING_NOTIFICATION_VIEW_ROUTE
} from '#src/server/marine-licence/withholding-notification/constants.js'
import {
  buildWithholdingSections,
  findWithholdingTask
} from '#src/server/marine-licence/withholding-notification/utils.js'

export const withholdingNotificationController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      await assertIsOriginalSubmitter(request, marineLicence)

      const task = findWithholdingTask(marineLicence)

      if (!task) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      return h.view(WITHHOLDING_NOTIFICATION_VIEW_ROUTE, {
        pageTitle: WITHHOLDING_NOTIFICATION_PAGE_TITLE,
        heading: WITHHOLDING_NOTIFICATION_PAGE_TITLE,
        pageCaption: `${marineLicence.applicationReference} - ${marineLicence.projectName}`,
        sections: buildWithholdingSections(task),
        marineLicenceId,
        taskId: task.taskId,
        isResolved: Boolean(task.resolvedAt),
        dashboardLink: routes.DASHBOARD,
        withholdingNotificationRoute:
          marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION,
        backLink: getViewDetailsUrl(marineLicenceId)
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(
        error,
        'Error displaying withholding notification page'
      )
      throw Boom.internal('Error displaying withholding notification page')
    }
  }
}

// Ownership is enforced by the API: the resolve endpoint runs authorizeOwnership, so a
// forged marineLicenceId in this payload resolves nothing.
export const withholdingNotificationSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        csrfToken: joi.string().allow(''),
        marineLicenceId: marineLicenceIdSchema,
        taskId: taskIdSchema
      }),
      failAction: (request, h) => {
        request.logger.warn(
          'Invalid withholding notification submission, redirecting to dashboard'
        )
        return h.redirect(routes.DASHBOARD).takeover()
      }
    }
  },
  async handler(request, h) {
    const { marineLicenceId, taskId } = request.payload

    try {
      await resolveApplicationTask(request, marineLicenceId, taskId)
    } catch (error) {
      request.logger.error(
        { err: error },
        `Error marking application task ${taskId} as read for marine licence ${marineLicenceId}`
      )
    }

    return h.redirect(getViewDetailsUrl(marineLicenceId))
  }
}
