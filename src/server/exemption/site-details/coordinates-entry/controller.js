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
import { routes } from '#src/server/common/constants/routes.js'
import {
  coordinatesEntrySettings,
  coordinatesEntryErrorMessages
} from '#src/server/common/validation/coordinates-entry/constants.js'
import { coordinatesEntrySchema } from '#src/server/common/validation/coordinates-entry/schema.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { getBackRoute } from './utils.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'

export const COORDINATES_ENTRY_VIEW_ROUTE = 'templates/coordinates-entry'

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
      payload: coordinatesEntrySchema,
      failAction: (request, h, err) => {
        const exemption = getExemptionCache(request)
        const action = request.query.action
        const site = setSiteData(request)
        return createFailAction({
          viewRoute: COORDINATES_ENTRY_VIEW_ROUTE,
          settings: coordinatesEntrySettings,
          errorMessages: coordinatesEntryErrorMessages,
          projectName: exemption.projectName,
          backLink: getBackRoute(site, exemption, action),
          payload: request.payload,
          params: {
            cancelLink: getCancelLink(action),
            siteNumber: exemption.multipleSiteDetails?.multipleSitesEnabled
              ? site.siteNumber
              : null,
            action
          }
        })(request, h, err)
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
