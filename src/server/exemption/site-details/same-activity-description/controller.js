import {
  getExemptionCache,
  updateExemptionMultipleSiteDetails,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  setSiteDataPreHandler,
  setSiteData
} from '#src/server/common/helpers/exemptions/session-cache/site-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import joi from 'joi'
import {
  answerChangedFromNoToYes,
  answerChangedFromYesToNo,
  getBackLink
} from './utils.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import {
  clearActivityData,
  copySameActivityDescriptionToAllSites
} from '#src/server/common/helpers/exemptions/copy-same-activity-data.js'

export const SAME_ACTIVITY_DESCRIPTION_VIEW_ROUTE =
  'exemption/site-details/same-activity-description/index'

export const SAME_ACTIVITY_DESCRIPTION_URL =
  '/exemption/same-activity-description'

const sameActivityDescriptionSettings = {
  pageTitle: 'Is the activity description the same for every site?',
  heading: 'Is the activity description the same for every site?'
}

export const errorMessages = {
  SAME_ACTIVITY_DESCRIPTION_REQUIRED:
    'Select whether the activity description is the same for every site'
}

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const exemption = getExemptionCache(request)
  const site = setSiteData(request)
  const action = request.query.action

  const backLink = getBackLink(exemption, site.siteDetails, action)
  const cancelLink = getCancelLink(action)

  if (!err.details) {
    return h
      .view(SAME_ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        ...sameActivityDescriptionSettings,
        backLink,
        cancelLink,
        payload,
        projectName: exemption.projectName
      })
      .takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(SAME_ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
      ...sameActivityDescriptionSettings,
      backLink,
      cancelLink,
      payload,
      projectName: exemption.projectName,
      errors,
      errorSummary
    })
    .takeover()
}
export const sameActivityDescriptionController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  async handler(request, h) {
    const { siteIndex, siteDetails, queryParams } = request.site
    const exemption = getExemptionCache(request)
    const action = request.query.action

    const { multipleSiteDetails } = exemption

    if (
      siteIndex > 0 &&
      multipleSiteDetails.sameActivityDescription === 'yes'
    ) {
      await updateExemptionSiteDetails(
        request,
        h,
        siteIndex,
        'activityDescription',
        exemption.siteDetails[0].activityDescription
      )
      return h.redirect(routes.COORDINATES_ENTRY_CHOICE + queryParams)
    }

    if (siteIndex > 0 && multipleSiteDetails.sameActivityDescription === 'no') {
      return h.redirect(routes.ACTIVITY_DESCRIPTION + queryParams)
    }

    return h.view(SAME_ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
      ...sameActivityDescriptionSettings,
      backLink: getBackLink(exemption, siteDetails, action),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      payload: {
        sameActivityDescription:
          exemption.multipleSiteDetails?.sameActivityDescription
      }
    })
  }
}
export const sameActivityDescriptionSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        sameActivityDescription: joi
          .string()
          .valid('yes', 'no')
          .required()
          .messages({
            'any.only': 'SAME_ACTIVITY_DESCRIPTION_REQUIRED',
            'string.empty': 'SAME_ACTIVITY_DESCRIPTION_REQUIRED',
            'any.required': 'SAME_ACTIVITY_DESCRIPTION_REQUIRED'
          })
      }),
      failAction: createValidationFailAction
    }
  },
  async handler(request, h) {
    const { payload, site } = request
    const { queryParams, siteDetails } = site
    const action = request.query.action
    const exemption = getExemptionCache(request)

    const previousAnswer =
      exemption.multipleSiteDetails?.sameActivityDescription
    const answerChanged = previousAnswer !== payload.sameActivityDescription

    if (action && !answerChanged) {
      return h.redirect(routes.REVIEW_SITE_DETAILS)
    }

    await updateExemptionMultipleSiteDetails(
      request,
      h,
      'sameActivityDescription',
      payload.sameActivityDescription
    )

    if (action) {
      if (answerChangedFromNoToYes(previousAnswer, payload)) {
        await clearActivityData(request, 'activityDescription', h)

        return h.redirect(routes.ACTIVITY_DESCRIPTION + '?action=change')
      }

      if (answerChangedFromYesToNo(previousAnswer, payload)) {
        await copySameActivityDescriptionToAllSites(request, h)
        await saveSiteDetailsToBackend(request, h)
        return h.redirect(routes.REVIEW_SITE_DETAILS)
      }
    }

    if (
      siteDetails.coordinatesType === 'file' &&
      payload.sameActivityDescription === 'no'
    ) {
      await saveSiteDetailsToBackend(request, h)
      return h.redirect(routes.REVIEW_SITE_DETAILS)
    }

    return h.redirect(routes.ACTIVITY_DESCRIPTION + queryParams)
  }
}
