import Boom from '@hapi/boom'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  getLocationIndex,
  getSiteNoticeEvidence,
  loadMarineLicence,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { locationNameSchema } from '#src/server/common/validation/location-name/schema.js'
import {
  locationNameErrorMessages,
  locationNameSettings
} from '#src/server/common/validation/location-name/constants.js'

export const SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE =
  'marine-licence/site-notice/location-name/index'

const siteNoticeLocationNameOptions = {
  ...validateMarineLicenceIdParams,
  pre: [validateEvidenceParam]
}

const getBackLink = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

const siteNoticeLocationNameSettings = (request, marineLicence) => ({
  projectName: marineLicence.projectName,
  locationIndex: getLocationIndex(request)
})

export const siteNoticeLocationNameController = {
  options: siteNoticeLocationNameOptions,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const marineLicence = request.marineLicence

      if (!findSiteNoticeTask(marineLicence)) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      const siteNoticeEvidence = getSiteNoticeEvidence(
        marineLicence,
        request.query.location
      )

      let payload = {}
      if (siteNoticeEvidence.locationName) {
        payload = { locationName: siteNoticeEvidence.locationName }
      }

      return h.view(SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE, {
        ...locationNameSettings,
        backLink: getBackLink(marineLicenceId),
        ...siteNoticeLocationNameSettings(request, marineLicence),
        payload
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }
      request.logger.error(
        error,
        'Error displaying site notice location name page'
      )
      throw Boom.internal('Error displaying site notice location name page')
    }
  }
}

export const siteNoticeLocationNameSubmitController = {
  options: {
    ...siteNoticeLocationNameOptions,
    validate: {
      payload: locationNameSchema,
      failAction: async (request, h, err) => {
        const { marineLicence, marineLicenceId } =
          await loadMarineLicence(request)

        if (!findSiteNoticeTask(marineLicence)) {
          return h.redirect(getViewDetailsUrl(marineLicenceId)).takeover()
        }

        return createFailAction({
          viewRoute: SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE,
          settings: locationNameSettings,
          errorMessages: locationNameErrorMessages,
          backLink: getBackLink(marineLicenceId),
          payload: request.payload,
          params: siteNoticeLocationNameSettings(request, marineLicence)
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const { marineLicenceId } = request.params
    const marineLicence = request.marineLicence

    if (!findSiteNoticeTask(marineLicence)) {
      return h.redirect(getViewDetailsUrl(marineLicenceId))
    }

    try {
      await authenticatedPatchRequest(
        request,
        apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE,
        {
          locationName: payload.locationName,
          id: marineLicenceId,
          evidenceIndex: Number.parseInt(request.query.location, 10) - 1
        }
      )

      return h.redirect(getBackLink(marineLicenceId))
    } catch (e) {
      const validation = e.data?.payload?.validation
      const details = validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(
        details,
        locationNameErrorMessages
      )
      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE, {
        ...locationNameSettings,
        payload,
        backLink: getBackLink(marineLicenceId),
        ...siteNoticeLocationNameSettings(request, marineLicence),
        errors,
        errorSummary
      })
    }
  }
}
