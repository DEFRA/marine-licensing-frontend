import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/session-cache/site-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import joi from 'joi'
import { routes } from '#src/server/common/constants/routes.js'
import { getBackRoute } from './utils.js'
import { getSiteNumber } from '#src/server/exemption/site-details/utils/site-number.js'

export const COORDINATES_ENTRY_VIEW_ROUTE =
  'exemption/site-details/coordinates-entry/index'

const coordinatesEntrySettings = {
  pageTitle: 'How do you want to enter the coordinates?',
  heading: 'How do you want to enter the coordinates?',
  backLink: routes.ACTIVITY_DESCRIPTION
}

export const errorMessages = {
  COORDINATES_ENTRY_REQUIRED: 'Select how you want to enter the coordinates'
}

const getCancelLink = (action) =>
  action ? undefined : routes.TASK_LIST + '?cancel=site-details'

export const coordinatesEntryController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { site } = request
    const { siteIndex } = site
    const action = request.query.action
    const siteNumber = getSiteNumber(exemption, request)

    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    if (action) {
      const savedSiteDetails = request.yar.get('savedSiteDetails') || {}

      if (!savedSiteDetails.originalCoordinatesEntry) {
        savedSiteDetails.originalCoordinatesEntry = siteDetails.coordinatesEntry
      }
      if (!savedSiteDetails.originalCoordinateSystem) {
        savedSiteDetails.originalCoordinateSystem = siteDetails.coordinateSystem
      }

      request.yar.set('savedSiteDetails', savedSiteDetails)
    }

    return h.view(COORDINATES_ENTRY_VIEW_ROUTE, {
      ...coordinatesEntrySettings,
      backLink: getBackRoute(request, exemption, action),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      siteNumber: action ? siteNumber : null,
      action,
      payload: {
        coordinatesEntry: siteDetails.coordinatesEntry
      }
    })
  }
}
export const coordinatesEntrySubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        coordinatesEntry: joi
          .string()
          .valid('single', 'multiple')
          .required()
          .messages({
            'any.only': 'COORDINATES_ENTRY_REQUIRED',
            'string.empty': 'COORDINATES_ENTRY_REQUIRED',
            'any.required': 'COORDINATES_ENTRY_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const exemption = getExemptionCache(request)
        const { projectName } = exemption
        const action = request.query.action
        const siteNumber = getSiteNumber(exemption, request)

        if (!err.details) {
          return h
            .view(COORDINATES_ENTRY_VIEW_ROUTE, {
              ...coordinatesEntrySettings,
              backLink: getBackRoute(request, exemption, action),
              cancelLink: getCancelLink(action),
              payload,
              projectName,
              siteNumber: action ? siteNumber : null,
              action
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(COORDINATES_ENTRY_VIEW_ROUTE, {
            ...coordinatesEntrySettings,
            backLink: getBackRoute(request, exemption, action),
            cancelLink: getCancelLink(action),
            payload,
            projectName,
            siteNumber: action ? siteNumber : null,
            action,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload } = request
    const { siteIndex, queryParams } = request.site
    const action = request.query.action

    updateExemptionSiteDetails(
      request,
      siteIndex,
      'coordinatesEntry',
      payload.coordinatesEntry
    )

    if (action) {
      const { originalCoordinatesEntry } =
        request.yar.get('savedSiteDetails') || {}

      if (payload.coordinatesEntry === originalCoordinatesEntry) {
        return h.redirect(
          `${routes.REVIEW_SITE_DETAILS}#site-details-${request.site.siteNumber}`
        )
      } else {
        updateExemptionSiteDetails(request, siteIndex, 'coordinateSystem', null)
        updateExemptionSiteDetails(request, siteIndex, 'coordinates', null)
        updateExemptionSiteDetails(request, siteIndex, 'circleWidth', null)

        return h.redirect(
          `${routes.COORDINATE_SYSTEM_CHOICE}?site=${request.site.siteNumber}&action=${action}`
        )
      }
    }

    return h.redirect(routes.COORDINATE_SYSTEM_CHOICE + queryParams)
  }
}
