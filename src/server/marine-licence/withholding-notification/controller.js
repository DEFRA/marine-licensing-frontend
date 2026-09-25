import Boom from '@hapi/boom'
import joi from 'joi'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  marineLicenceIdSchema,
  validateMarineLicenceIdParams
} from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import {
  WITHHOLDING_NOTIFICATION_PAGE_TITLE,
  WITHHOLDING_NOTIFICATION_VIEW_ROUTE
} from '#src/server/marine-licence/withholding-notification/constants.js'
import {
  buildWithholdingSections,
  findWithholdingTask
} from '#src/server/marine-licence/withholding-notification/utils.js'

const viewDetailsUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`

const assertIsOriginalSubmitter = async (request, marineLicence) => {
  const userSession = await getUserSession(request, request.state?.userSession)

  if (
    !userSession?.contactId ||
    userSession.contactId !== marineLicence.contactId
  ) {
    throw Boom.forbidden(
      'Only the person who submitted the application can view its notifications'
    )
  }
}

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
        return h.redirect(viewDetailsUrl(marineLicenceId))
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
        backLink: viewDetailsUrl(marineLicenceId)
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
        taskId: joi.string().hex().length(24).required()
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
      await authenticatedPostRequest(
        request,
        `/marine-licence/${marineLicenceId}/application-tasks/${taskId}/resolve`,
        {}
      )
    } catch (error) {
      // The applicant has read the notification either way, so a failure here must not
      // strand them on an error page.
      request.logger.error(
        { err: error, marineLicenceId, taskId },
        'Error marking application task as read'
      )
    }

    return h.redirect(viewDetailsUrl(marineLicenceId))
  }
}
