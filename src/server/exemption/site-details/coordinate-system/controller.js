import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import {
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/session-cache/site-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'

import joi from 'joi'

export const COORDINATE_SYSTEM_VIEW_ROUTE =
  'exemption/site-details/coordinate-system/index'

const coordinateSystemSettings = {
  pageTitle: 'Which coordinate system do you want to use?',
  heading: 'Which coordinate system do you want to use?',
  backLink: routes.COORDINATES_ENTRY_CHOICE
}

export const errorMessages = {
  COORDINATE_SYSTEM_REQUIRED: 'Select which coordinate system you want to use'
}

const getCancelLink = (action) =>
  action ? undefined : routes.TASK_LIST + '?cancel=site-details'

const getBackLink = (action, siteNumber, queryParams, coordinateSystem) => {
  if (action) {
    if (coordinateSystem === null || coordinateSystem === undefined) {
      return `${routes.COORDINATES_ENTRY_CHOICE}?site=${siteNumber}&action=${action}`
    }
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }
  return coordinateSystemSettings.backLink + queryParams
}

export const coordinateSystemController = {
  options: { pre: [setSiteDataPreHandler] },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { siteIndex, queryParams, siteNumber } = request.site
    const action = request.query.action

    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    if (action) {
      const savedSiteDetails = request.yar.get('savedSiteDetails') || {}

      if (!savedSiteDetails.originalCoordinateSystem) {
        savedSiteDetails.originalCoordinateSystem = siteDetails.coordinateSystem
      }

      request.yar.set('savedSiteDetails', savedSiteDetails)
    }

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTE, {
      ...coordinateSystemSettings,
      backLink: getBackLink(
        action,
        siteNumber,
        queryParams,
        siteDetails.coordinateSystem
      ),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      siteNumber: exemption.multipleSiteDetails?.multipleSitesEnabled
        ? siteNumber
        : null,
      action,
      payload: {
        coordinateSystem: siteDetails.coordinateSystem
      }
    })
  }
}
export const coordinateSystemSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        coordinateSystem: joi
          .string()
          .valid('wgs84', 'osgb36')
          .required()
          .messages({
            'any.only': 'COORDINATE_SYSTEM_REQUIRED',
            'string.empty': 'COORDINATE_SYSTEM_REQUIRED',
            'any.required': 'COORDINATE_SYSTEM_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const exemption = getExemptionCache(request)
        const { projectName } = exemption
        const action = request.query.action
        const { siteNumber } = request.site

        const site = setSiteData(request)
        const { queryParams, siteIndex } = site
        const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

        const siteNumberDisplay = exemption.multipleSiteDetails
          ?.multipleSitesEnabled
          ? siteNumber
          : null

        if (!err.details) {
          return h
            .view(COORDINATE_SYSTEM_VIEW_ROUTE, {
              ...coordinateSystemSettings,
              backLink: getBackLink(
                action,
                siteNumber,
                queryParams,
                siteDetails.coordinateSystem
              ),
              cancelLink: getCancelLink(action),
              payload,
              projectName,
              siteNumber: siteNumberDisplay,
              action
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(COORDINATE_SYSTEM_VIEW_ROUTE, {
            ...coordinateSystemSettings,
            backLink: getBackLink(
              action,
              siteNumber,
              queryParams,
              siteDetails.coordinateSystem
            ),
            cancelLink: getCancelLink(action),
            payload,
            projectName,
            siteNumber: siteNumberDisplay,
            action,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload, site } = request
    const { siteIndex, queryParams } = site
    const action = request.query.action

    const exemption = getExemptionCache(request)

    updateExemptionSiteDetails(
      request,
      siteIndex,
      'coordinateSystem',
      payload.coordinateSystem
    )

    if (action) {
      const { originalCoordinateSystem } =
        request.yar.get('savedSiteDetails') || {}

      if (payload.coordinateSystem === originalCoordinateSystem) {
        return h.redirect(
          `${routes.REVIEW_SITE_DETAILS}#site-details-${site.siteNumber}`
        )
      }
    }

    const coordinatesEntry = getSiteDetailsBySite(
      exemption,
      siteIndex
    )?.coordinatesEntry

    if (coordinatesEntry === 'single') {
      const nextRoute = action
        ? `${routes.CIRCLE_CENTRE_POINT}?site=${site.siteNumber}&action=${action}`
        : routes.CIRCLE_CENTRE_POINT + queryParams

      return h.redirect(nextRoute)
    }

    if (coordinatesEntry === 'multiple') {
      const nextRoute = action
        ? `${routes.ENTER_MULTIPLE_COORDINATES}?site=${site.siteNumber}&action=${action}`
        : routes.ENTER_MULTIPLE_COORDINATES + queryParams

      return h.redirect(nextRoute)
    }

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTE, {
      ...coordinateSystemSettings,
      backLink: coordinateSystemSettings.backLink + queryParams,
      projectName: exemption.projectName,
      payload: {
        coordinateSystem: payload.coordinateSystem
      }
    })
  }
}
