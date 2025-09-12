import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import {
  getExemptionCache,
  setExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import joi from 'joi'
import { getBackLink } from './utils.js'
import { getSiteNumber } from '~/src/server/exemption/site-details/utils/site-number.js'

export const ACTIVITY_DESCRIPTION_VIEW_ROUTE =
  'exemption/activity-description/index'

const ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH = 4000

export const errorMessages = {
  ACTIVITY_DESCRIPTION_REQUIRED: 'Enter the activity description',
  ACTIVITY_DESCRIPTION_MAX_LENGTH: `Activity description must be ${ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH} characters or less`
}

const templateValues = {
  pageTitle: 'Activity description',
  heading: 'Activity description'
}

const isPageInSiteDetailsFlow = (request) =>
  request.url.pathname === routes.SITE_DETAILS_ACTIVITY_DESCRIPTION

const getPageTemplateValues = (request) => {
  const siteDetailsFlow = isPageInSiteDetailsFlow(request)
  const exemption = getExemptionCache(request)
  const siteNumber = getSiteNumber(exemption, request)

  const { multipleSiteDetails } = exemption

  const variableActivityDescription =
    multipleSiteDetails?.sameActivityDescription === 'no'

  return {
    ...templateValues,
    isMultiSiteJourney: !!multipleSiteDetails?.multipleSitesEnabled,
    isSiteDetailsFlow: siteDetailsFlow,
    backLink: getBackLink(exemption, siteDetailsFlow),
    projectName: exemption.projectName,
    siteNumber: variableActivityDescription ? siteNumber : null
  }
}

/**
 * A GDS styled activity description page GET controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDescriptionController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const isInSiteDetailsFlow = isPageInSiteDetailsFlow(request)

    const activityDescription = isInSiteDetailsFlow
      ? getSiteDetailsBySite(exemption)?.activityDescription
      : exemption.activityDescription

    return h.view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
      ...getPageTemplateValues(request),
      payload: { activityDescription }
    })
  }
}

/**
 * A GDS styled activity description PATCH page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDescriptionSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        activityDescription: joi
          .string()
          .min(1)
          .max(ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH)
          .required()
          .messages({
            'string.empty': errorMessages.ACTIVITY_DESCRIPTION_REQUIRED,
            'string.max': errorMessages.ACTIVITY_DESCRIPTION_MAX_LENGTH
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        if (!err.details) {
          return h
            .view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
              ...getPageTemplateValues(request),
              payload
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
            ...getPageTemplateValues(request),
            payload,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    try {
      const isInSiteDetailsFlow = isPageInSiteDetailsFlow(request)

      if (isInSiteDetailsFlow) {
        updateExemptionSiteDetails(
          request,
          0,
          'activityDescription',
          payload.activityDescription
        )
      } else {
        const { payload: responsePayload } = await authenticatedPatchRequest(
          request,
          '/exemption/activity-description',
          { ...payload, id: exemption.id }
        )

        setExemptionCache(request, {
          ...exemption,
          ...responsePayload.value,
          activityDescription: payload.activityDescription
        })
      }

      return h.redirect(
        isInSiteDetailsFlow ? routes.COORDINATES_ENTRY_CHOICE : routes.TASK_LIST
      )
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}

      if (!details) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)
      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        ...getPageTemplateValues(request),
        payload,
        errors,
        errorSummary
      })
    }
  }
}
