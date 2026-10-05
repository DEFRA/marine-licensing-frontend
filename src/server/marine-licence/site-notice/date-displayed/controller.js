import Boom from '@hapi/boom'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  getLocationIndex,
  loadMarineLicence,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { extractDateFieldsFromPayload } from '#src/server/common/helpers/dates/date-utils.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { dateDisplayedSchema } from '#src/server/common/validation/date-displayed/schema.js'
import {
  dateDisplayedErrorMessages,
  dateDisplayedSettings
} from '#src/server/common/validation/date-displayed/constants.js'
import {
  mapDateDisplayedErrors,
  validateDateDisplayed
} from '#src/server/marine-licence/site-notice/date-displayed/utils.js'

export const SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE =
  'marine-licence/site-notice/date-displayed/index'

const siteNoticeDateDisplayedOptions = {
  ...validateMarineLicenceIdParams,
  pre: [validateEvidenceParam]
}

const siteNoticeDisplayUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

const siteNoticeDateDisplayedSettings = (request, marineLicence) => ({
  projectName: marineLicence.projectName,
  locationIndex: getLocationIndex(request)
})

export const siteNoticeDateDisplayedController = {
  options: siteNoticeDateDisplayedOptions,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const marineLicence = request.marineLicence

      if (!findSiteNoticeTask(marineLicence)) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      const siteNoticeEvidence = marineLicence.siteNoticeEvidence ?? []
      const evidenceIndex = Number.parseInt(request.query.evidence, 10) - 1
      const existingEvidence = siteNoticeEvidence[evidenceIndex]

      let payload = {}
      if (existingEvidence?.dateDisplayed) {
        const { day, month, year } = existingEvidence.dateDisplayed
        payload = {
          'date-displayed-day': day,
          'date-displayed-month': month,
          'date-displayed-year': year
        }
      }

      return h.view(SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE, {
        ...dateDisplayedSettings,
        backLink: siteNoticeDisplayUrl(marineLicenceId),
        ...siteNoticeDateDisplayedSettings(request, marineLicence),
        payload
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }
      request.logger.error(
        error,
        'Error displaying site notice date displayed page'
      )
      throw Boom.internal('Error displaying site notice date displayed page')
    }
  }
}

const showErrorView = (request, h, err, marineLicence) =>
  createFailAction({
    viewRoute: SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE,
    settings: dateDisplayedSettings,
    errorMessages: dateDisplayedErrorMessages,
    backLink: siteNoticeDisplayUrl(request.params.marineLicenceId),
    payload: request.payload,
    params: siteNoticeDateDisplayedSettings(request, marineLicence)
  })(request, h, { details: mapDateDisplayedErrors(err.details) })

export const siteNoticeDateDisplayedSubmitController = {
  options: {
    ...siteNoticeDateDisplayedOptions,
    validate: {
      payload: dateDisplayedSchema,
      failAction: async (request, h, err) => {
        const { marineLicence, marineLicenceId } =
          await loadMarineLicence(request)

        if (!findSiteNoticeTask(marineLicence)) {
          return h.redirect(getViewDetailsUrl(marineLicenceId)).takeover()
        }

        return showErrorView(request, h, err, marineLicence)
      }
    }
  },
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const marineLicence = request.marineLicence

    if (!findSiteNoticeTask(marineLicence)) {
      return h.redirect(getViewDetailsUrl(marineLicenceId))
    }

    const dateDisplayed = extractDateFieldsFromPayload(
      request.payload,
      'date-displayed'
    )
    const dateDetails = validateDateDisplayed(dateDisplayed)

    if (dateDetails.length > 0) {
      return showErrorView(request, h, { details: dateDetails }, marineLicence)
    }

    try {
      await authenticatedPatchRequest(
        request,
        apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE,
        {
          dateDisplayed,
          id: marineLicenceId,
          evidenceIndex: Number.parseInt(request.query.evidence, 10) - 1
        }
      )

      return h.redirect(siteNoticeDisplayUrl(marineLicenceId))
    } catch (e) {
      const details = e.data?.payload?.validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      return showErrorView(request, h, { details }, marineLicence)
    }
  }
}
