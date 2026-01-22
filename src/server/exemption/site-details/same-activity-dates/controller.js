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
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import {
  clearActivityData,
  copySameActivityDatesToAllSites
} from '#src/server/common/helpers/exemptions/copy-same-activity-data.js'
import joi from 'joi'
import { answerChangedFromNoToYes, answerChangedFromYesToNo } from './utils.js'

export const SAME_ACTIVITY_DATES_VIEW_ROUTE =
  'exemption/site-details/same-activity-dates/index'

export const SAME_ACTIVITY_DATES_URL = '/exemption/same-activity-dates'

const sameActivityDatesSettings = {
  pageTitle: 'Are the activity dates the same for every site?',
  heading: 'Are the activity dates the same for every site?'
}

export const errorMessages = {
  SAME_ACTIVITY_DATES_REQUIRED:
    'Select whether the activity dates are the same for every site'
}

const getBackLinkForAction = (action, siteDetails) => {
  if (action) {
    return routes.REVIEW_SITE_DETAILS
  }
  return siteDetails.coordinatesType === 'file'
    ? routes.FILE_UPLOAD
    : routes.SITE_NAME
}

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const exemption = getExemptionCache(request)
  const action = request.query.action

  const site = setSiteData(request)
  const { siteDetails } = site

  const backLink = getBackLinkForAction(action, siteDetails)
  const cancelLink = getCancelLink(action)

  if (!err.details) {
    return h
      .view(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        ...sameActivityDatesSettings,
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
    .view(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
      ...sameActivityDatesSettings,
      backLink,
      cancelLink,
      payload,
      projectName: exemption.projectName,
      errors,
      errorSummary
    })
    .takeover()
}
export const sameActivityDatesController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  async handler(request, h) {
    const { siteIndex, siteDetails, queryParams } = request.site
    const exemption = getExemptionCache(request)
    const action = request.query.action

    const { multipleSiteDetails } = exemption

    if (siteIndex > 0 && multipleSiteDetails.sameActivityDates === 'yes') {
      await updateExemptionSiteDetails(
        request,
        h,
        siteIndex,
        'activityDates',
        exemption.siteDetails[0].activityDates
      )
      return h.redirect(routes.SAME_ACTIVITY_DESCRIPTION + queryParams)
    }

    if (siteIndex > 0 && multipleSiteDetails.sameActivityDates === 'no') {
      return h.redirect(routes.ACTIVITY_DATES + queryParams)
    }

    return h.view(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
      ...sameActivityDatesSettings,
      backLink: getBackLinkForAction(action, siteDetails),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      payload: {
        sameActivityDates: exemption.multipleSiteDetails?.sameActivityDates
      }
    })
  }
}
export const sameActivityDatesSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        sameActivityDates: joi.string().valid('yes', 'no').required().messages({
          'any.only': 'SAME_ACTIVITY_DATES_REQUIRED',
          'string.empty': 'SAME_ACTIVITY_DATES_REQUIRED',
          'any.required': 'SAME_ACTIVITY_DATES_REQUIRED'
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

    const previousAnswer = exemption.multipleSiteDetails?.sameActivityDates
    const answerChanged = previousAnswer !== payload.sameActivityDates

    if (action && !answerChanged) {
      return h.redirect(routes.REVIEW_SITE_DETAILS)
    }

    await updateExemptionMultipleSiteDetails(
      request,
      h,
      'sameActivityDates',
      payload.sameActivityDates
    )

    if (action) {
      if (answerChangedFromNoToYes(previousAnswer, payload)) {
        await clearActivityData(request, 'activityDates', h)

        return h.redirect(routes.ACTIVITY_DATES + '?action=change')
      }

      if (answerChangedFromYesToNo(previousAnswer, payload)) {
        await copySameActivityDatesToAllSites(request, h)
        await saveSiteDetailsToBackend(request, h)
        return h.redirect(routes.REVIEW_SITE_DETAILS)
      }
    }

    if (
      siteDetails.coordinatesType === 'file' &&
      payload.sameActivityDates === 'no'
    ) {
      return h.redirect(routes.SAME_ACTIVITY_DESCRIPTION)
    }

    return h.redirect(routes.ACTIVITY_DATES + queryParams)
  }
}
