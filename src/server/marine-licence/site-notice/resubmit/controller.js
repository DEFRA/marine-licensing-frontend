import Boom from '@hapi/boom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  isResubmissionComplete,
  loadResubmissionTask,
  resubmissionUrl,
  validateResubmissionParams
} from '#src/server/common/helpers/marine-licence/site-notice-resubmission.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import { getEvidenceSubmission } from '#src/server/marine-licence/site-notice/display/utils.js'
import { getResubmissionLocations } from '#src/server/marine-licence/site-notice/resubmit/utils.js'

const SITE_NOTICE_RESUBMIT_VIEW_ROUTE =
  'marine-licence/site-notice/resubmit/index'

const siteNoticeResubmitSettings = {
  pageTitle: 'Resubmit site notice evidence',
  heading: 'Resubmit site notice evidence'
}

const getPhotoLinks = (marineLicenceId, taskId) => ({
  closeUpPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO}/${marineLicenceId}/${taskId}`,
  positionPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO}/${marineLicenceId}/${taskId}`
})

export const siteNoticeResubmitController = {
  options: {
    ...validateResubmissionParams,
    pre: [loadResubmissionTask]
  },
  handler(request, h) {
    const { marineLicenceId } = request.params
    const { marineLicence, resubmissionTask: task } = request

    try {
      const locations = getResubmissionLocations(marineLicence, task)
      const evidenceSubmission = getEvidenceSubmission(task)

      return h.view(SITE_NOTICE_RESUBMIT_VIEW_ROUTE, {
        ...siteNoticeResubmitSettings,
        backLink: getViewDetailsUrl(marineLicenceId),
        pageCaption: `${marineLicence.applicationReference} - ${marineLicence.projectName}`,
        photoLinks: getPhotoLinks(marineLicenceId, task.taskId),
        locations,
        evidenceSubmission,
        canSendEvidence:
          !evidenceSubmission && isResubmissionComplete(locations)
      })
    } catch (error) {
      request.logger.error(
        error,
        'Error displaying resubmit site notice evidence page'
      )
      throw Boom.internal('Error displaying resubmit site notice evidence page')
    }
  }
}

export const siteNoticeResubmitSubmitController = {
  options: {
    ...validateResubmissionParams,
    pre: [loadResubmissionTask]
  },
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const { marineLicence, resubmissionTask: task } = request

    if (
      task.resolvedAt ||
      !isResubmissionComplete(getResubmissionLocations(marineLicence, task))
    ) {
      return h.redirect(resubmissionUrl(marineLicenceId, task.taskId))
    }

    await authenticatedPostRequest(
      request,
      apiRoutes.RESOLVE_APPLICATION_TASK.replace(
        '{marineLicenceId}',
        marineLicenceId
      ).replace('{taskId}', task.taskId),
      {}
    )

    return h.redirect(getViewDetailsUrl(marineLicenceId))
  }
}
