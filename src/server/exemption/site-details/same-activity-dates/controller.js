import {
  getExemptionCache,
  updateExemptionMultipleSiteDetails,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  setSiteDataPreHandler,
  setSiteData
} from '#src/server/common/helpers/session-cache/site-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import joi from 'joi'

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

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const exemption = getExemptionCache(request)

  const site = setSiteData(request)
  const { siteDetails } = site

  const backLink =
    siteDetails.coordinatesType === 'file'
      ? routes.FILE_UPLOAD
      : routes.SITE_NAME

  if (!err.details) {
    return h
      .view(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        ...sameActivityDatesSettings,
        backLink,
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
  handler(request, h) {
    const { siteIndex, siteDetails, queryParams } = request.site
    const exemption = getExemptionCache(request)

    const { multipleSiteDetails } = exemption

    if (siteIndex > 0 && multipleSiteDetails.sameActivityDates === 'yes') {
      updateExemptionSiteDetails(
        request,
        siteIndex,
        'activityDates',
        exemption.siteDetails[0].activityDates
      )
      return h.redirect(routes.SAME_ACTIVITY_DESCRIPTION + queryParams)
    }

    if (siteIndex > 0 && multipleSiteDetails.sameActivityDates === 'no') {
      return h.redirect(routes.SITE_DETAILS_ACTIVITY_DATES + queryParams)
    }

    return h.view(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
      ...sameActivityDatesSettings,
      backLink:
        siteDetails.coordinatesType === 'file'
          ? routes.FILE_UPLOAD
          : routes.SITE_NAME,
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
  handler(request, h) {
    const { payload, site } = request
    const { queryParams, siteDetails } = site

    updateExemptionMultipleSiteDetails(
      request,
      'sameActivityDates',
      payload.sameActivityDates
    )

    if (
      siteDetails.coordinatesType === 'file' &&
      payload.sameActivityDates === 'no'
    ) {
      return h.redirect(routes.SAME_ACTIVITY_DESCRIPTION)
    }

    return h.redirect(routes.SITE_DETAILS_ACTIVITY_DATES + queryParams)
  }
}
