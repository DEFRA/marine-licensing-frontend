import {
  getExemptionCache,
  setSavedSiteDetails,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  setSiteDataPreHandler,
  setSiteData
} from '#src/server/common/helpers/exemptions/session-cache/site-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import joi from 'joi'
import { routes } from '#src/server/common/constants/routes.js'
import { getBackRoute } from './utils.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'

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

export const coordinatesEntryController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { site } = request
    const { siteIndex, siteNumber } = site
    const action = request.query.action

    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    if (action) {
      const savedSiteDetails = request.yar.get('savedSiteDetails') || {}

      if (!savedSiteDetails.originalCoordinatesEntry) {
        savedSiteDetails.originalCoordinatesEntry = siteDetails.coordinatesEntry
      }
      if (!savedSiteDetails.originalCoordinateSystem) {
        savedSiteDetails.originalCoordinateSystem = siteDetails.coordinateSystem
      }

      await setSavedSiteDetails(request, h, savedSiteDetails)
    }

    return h.view(COORDINATES_ENTRY_VIEW_ROUTE, {
      ...coordinatesEntrySettings,
      backLink: getBackRoute(site, exemption, action),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      siteNumber: exemption.multipleSiteDetails?.multipleSitesEnabled
        ? siteNumber
        : null,
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

        const site = setSiteData(request)
        const { siteNumber } = site

        const siteNumberDisplay = exemption.multipleSiteDetails
          ?.multipleSitesEnabled
          ? siteNumber
          : null

        if (!err.details) {
          return h
            .view(COORDINATES_ENTRY_VIEW_ROUTE, {
              ...coordinatesEntrySettings,
              backLink: getBackRoute(site, exemption, action),
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
          .view(COORDINATES_ENTRY_VIEW_ROUTE, {
            ...coordinatesEntrySettings,
            backLink: getBackRoute(site, exemption, action),
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
  async handler(request, h) {
    const { payload } = request
    const { siteIndex, siteDetails, queryParams } = request.site
    const action = request.query.action

    await updateExemptionSiteDetails(
      request,
      h,
      siteIndex,
      'coordinatesEntry',
      payload.coordinatesEntry
    )

    if (action) {
      const { originalCoordinatesEntry } =
        request.yar.get('savedSiteDetails') || {}

      const isStartOfChangeJourney = !!siteDetails.coordinateSystem

      const isValueUnchanged =
        payload.coordinatesEntry === originalCoordinatesEntry

      if (isStartOfChangeJourney && isValueUnchanged) {
        return h.redirect(
          `${routes.REVIEW_SITE_DETAILS}#site-details-${request.site.siteNumber}`
        )
      }

      if (isStartOfChangeJourney) {
        await updateExemptionSiteDetails(
          request,
          h,
          siteIndex,
          'coordinateSystem',
          null
        )
        await updateExemptionSiteDetails(
          request,
          h,
          siteIndex,
          'coordinates',
          null
        )
        await updateExemptionSiteDetails(
          request,
          h,
          siteIndex,
          'circleWidth',
          null
        )
      }

      return h.redirect(
        `${routes.COORDINATE_SYSTEM_CHOICE}?site=${request.site.siteNumber}&action=${action}`
      )
    }

    return h.redirect(routes.COORDINATE_SYSTEM_CHOICE + queryParams)
  }
}
