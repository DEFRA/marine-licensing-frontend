import Boom from '@hapi/boom'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import {
  getViewDetailsUrl,
  assertIsOriginalSubmitter
} from '#src/server/common/helpers/view-details/utils.js'
import { findSiteNoticeTask } from '#src/server/common/helpers/marine-licence/site-notice.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  getDisplayConditions,
  getEvidenceSubmission,
  getSiteNoticeValues,
  isSiteNoticeEvidenceComplete,
  getCanAddLocation
} from '#src/server/marine-licence/site-notice/display/utils.js'
import { siteNoticeDisplayUrl } from '#src/server/marine-licence/site-notice/utils.js'

export const SITE_NOTICE_DISPLAY_VIEW_ROUTE =
  'marine-licence/site-notice/display/index'

const siteNoticeDisplaySettings = {
  pageTitle: 'Display a site notice',
  heading: 'Display a site notice'
}

const getEvidenceLinks = (marineLicenceId) => ({
  locationName: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/${marineLicenceId}`,
  dateDisplayed: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DATE_DISPLAYED}/${marineLicenceId}`,
  closeUpPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${marineLicenceId}`,
  positionPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/${marineLicenceId}`
})

export const siteNoticeDisplayController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      await assertIsOriginalSubmitter(request, marineLicence)

      const task = findSiteNoticeTask(marineLicence)

      if (!task) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      const displayConditions = getDisplayConditions(marineLicence, task.data)

      const viewDetailsUrl = getViewDetailsUrl(marineLicenceId)

      const siteNoticeEvidence = getSiteNoticeValues(marineLicence)

      const evidenceSubmission = getEvidenceSubmission(task)

      const siteNoticeEvidenceComplete =
        isSiteNoticeEvidenceComplete(siteNoticeEvidence)

      const canAddLocation = getCanAddLocation(
        siteNoticeEvidence,
        evidenceSubmission
      )

      const addEvidenceFormAction = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_ADD_EVIDENCE}/${marineLicenceId}`

      return h.view(SITE_NOTICE_DISPLAY_VIEW_ROUTE, {
        ...siteNoticeDisplaySettings,
        backLink: viewDetailsUrl,
        pageCaption: `${marineLicence.applicationReference} - ${marineLicence.projectName}`,
        evidenceLinks: getEvidenceLinks(marineLicenceId),
        siteNoticeEvidence,
        evidenceSubmission,
        canSendEvidence: !evidenceSubmission && !!siteNoticeEvidenceComplete,
        canAddLocation,
        addEvidenceFormAction,
        ...displayConditions
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }
      request.logger.error(error, 'Error displaying site notice display page')
      throw Boom.internal('Error displaying site notice display page')
    }
  }
}

export const siteNoticeDisplaySubmitController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    const service = getMarineLicenceService(request)
    const marineLicence = await service.getMarineLicenceById(marineLicenceId)

    await assertIsOriginalSubmitter(request, marineLicence)

    const task = findSiteNoticeTask(marineLicence)

    if (!task) {
      return h.redirect(getViewDetailsUrl(marineLicenceId))
    }

    if (
      task.resolvedAt ||
      !isSiteNoticeEvidenceComplete(getSiteNoticeValues(marineLicence))
    ) {
      return h.redirect(siteNoticeDisplayUrl(marineLicenceId))
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

export const siteNoticeDisplayAddEvidenceController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      await assertIsOriginalSubmitter(request, marineLicence)

      const task = findSiteNoticeTask(marineLicence)

      if (!task) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      if (task.resolvedAt) {
        return h.redirect(siteNoticeDisplayUrl(marineLicenceId))
      }

      await authenticatedPostRequest(
        request,
        apiRoutes.ADD_SITE_NOTICE_EVIDENCE,
        { id: marineLicenceId }
      )

      const newLocationNumber =
        (marineLicence.siteNoticeEvidence?.length ?? 0) + 1

      return h.redirect(
        `${siteNoticeDisplayUrl(marineLicenceId)}#site-location-${newLocationNumber}`
      )
    } catch (error) {
      if (error.isBoom) {
        throw error
      }
      request.logger.error(
        error,
        'Error adding site notice evidence placeholder'
      )

      return h.redirect(siteNoticeDisplayUrl(marineLicenceId))
    }
  }
}
