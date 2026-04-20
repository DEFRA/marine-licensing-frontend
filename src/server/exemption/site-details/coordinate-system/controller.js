import {
  getExemptionCache,
  setSavedSiteDetails,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import {
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/exemptions/session-cache/site-utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import {
  coordinateSystemSettings,
  coordinateSystemErrorMessages
} from '#src/server/common/validation/coordinate-system/constants.js'
import { coordinateSystemSchema } from '#src/server/common/validation/coordinate-system/schema.js'

export const COORDINATE_SYSTEM_VIEW_ROUTE = 'templates/coordinate-system'

const getBackLink = (action, siteNumber, queryParams, request) => {
  if (action) {
    const savedSiteDetails = request.yar.get('savedSiteDetails') || {}
    if (savedSiteDetails.originalCoordinatesEntry) {
      return `${routes.COORDINATES_ENTRY_CHOICE}?site=${siteNumber}&action=${action}`
    }
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }
  return routes.COORDINATES_ENTRY_CHOICE + queryParams
}

export const coordinateSystemController = {
  options: { pre: [setSiteDataPreHandler] },
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { queryParams, siteNumber, siteDetails } = request.site
    const action = request.query.action

    if (action) {
      const savedSiteDetails = request.yar.get('savedSiteDetails') || {}

      if (!savedSiteDetails.originalCoordinateSystem) {
        savedSiteDetails.originalCoordinateSystem = siteDetails.coordinateSystem
      }

      await setSavedSiteDetails(request, h, savedSiteDetails)
    }

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTE, {
      ...coordinateSystemSettings,
      backLink: getBackLink(action, siteNumber, queryParams, request),
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
      payload: coordinateSystemSchema,
      failAction: (request, h, err) => {
        const exemption = getExemptionCache(request)
        const action = request.query.action
        const site = setSiteData(request)
        const { queryParams, siteNumber } = site
        return createFailAction({
          viewRoute: COORDINATE_SYSTEM_VIEW_ROUTE,
          settings: coordinateSystemSettings,
          errorMessages: coordinateSystemErrorMessages,
          projectName: exemption.projectName,
          backLink: getBackLink(action, siteNumber, queryParams, request),
          payload: request.payload,
          params: {
            cancelLink: getCancelLink(action),
            siteNumber: exemption.multipleSiteDetails?.multipleSitesEnabled
              ? siteNumber
              : null,
            action
          }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload, site } = request
    const { siteIndex, queryParams, siteDetails } = site
    const action = request.query.action

    const exemption = getExemptionCache(request)

    await updateExemptionSiteDetails(
      request,
      h,
      siteIndex,
      'coordinateSystem',
      payload.coordinateSystem
    )

    if (action) {
      const { originalCoordinateSystem } =
        request.yar.get('savedSiteDetails') || {}

      const isStartOfChangeJourney = !!siteDetails.coordinates

      const isValueUnchanged =
        payload.coordinateSystem === originalCoordinateSystem

      if (isStartOfChangeJourney && isValueUnchanged) {
        return h.redirect(
          `${routes.REVIEW_SITE_DETAILS}#site-details-${site.siteNumber}`
        )
      }

      if (isStartOfChangeJourney) {
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
    }

    const coordinatesEntry = siteDetails.coordinatesEntry

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
      backLink: routes.COORDINATES_ENTRY_CHOICE + queryParams,
      projectName: exemption.projectName,
      payload: {
        coordinateSystem: payload.coordinateSystem
      }
    })
  }
}
