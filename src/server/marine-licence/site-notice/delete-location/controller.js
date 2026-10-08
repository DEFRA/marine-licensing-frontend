import Boom from '@hapi/boom'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  getLocationIndex,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { siteNoticeDisplayUrl } from '#src/server/marine-licence/site-notice/utils.js'

export const DELETE_LOCATION_VIEW_ROUTE =
  'marine-licence/site-notice/delete-location/index'

const validateDeletableLocation = {
  method: (request, h) => {
    const { marineLicence } = request
    const { marineLicenceId } = request.params
    const task = findSiteNoticeTask(marineLicence)

    if (!task) {
      return h.redirect(getViewDetailsUrl(marineLicenceId)).takeover()
    }

    if (task.resolvedAt || getLocationIndex(request) === 1) {
      return h.redirect(siteNoticeDisplayUrl(marineLicenceId)).takeover()
    }

    return h.continue
  }
}

const deleteLocationOptions = {
  ...validateMarineLicenceIdParams,
  pre: [validateEvidenceParam, validateDeletableLocation]
}

export const deleteLocationController = {
  options: deleteLocationOptions,
  handler(request, h) {
    const { marineLicenceId } = request.params
    const locationNumber = getLocationIndex(request)
    const pageTitle = `Are you sure you want to delete location ${locationNumber}?`

    return h.view(DELETE_LOCATION_VIEW_ROUTE, {
      pageTitle,
      heading: pageTitle,
      projectName: request.marineLicence.projectName,
      backLink: `${siteNoticeDisplayUrl(marineLicenceId)}#site-location-${locationNumber}`
    })
  }
}

export const deleteLocationSubmitController = {
  options: deleteLocationOptions,
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const evidenceIndex = getLocationIndex(request) - 1

    try {
      await authenticatedPatchRequest(
        request,
        apiRoutes.DELETE_SITE_NOTICE_EVIDENCE,
        { id: marineLicenceId, evidenceIndex }
      )
    } catch (error) {
      request.logger.error(
        {
          event: {
            action: 'marine-licence:delete-site-notice-location-failed',
            reference: marineLicenceId,
            reason: `evidenceIndex=${evidenceIndex}`
          }
        },
        'Error deleting site notice location'
      )
      throw Boom.internal('Error deleting site notice location')
    }

    return h.redirect(siteNoticeDisplayUrl(marineLicenceId))
  }
}
