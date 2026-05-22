import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails,
  updateMarineLicenceSiteDetailsMultiple,
  getSavedSiteDetails,
  setSavedSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  coordinatesEntrySettings,
  coordinatesEntryErrorMessages
} from '#src/server/common/validation/coordinates-entry/constants.js'
import { coordinatesEntrySchema } from '#src/server/common/validation/coordinates-entry/schema.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteParam } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'
import { getSiteDetailsAnchor } from '#src/server/common/helpers/site-details/anchor-utils.js'

export const MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE =
  'templates/coordinates-entry'

const getBackLink = (action, siteNumber) =>
  action
    ? `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
    : marineLicenceRoutes.MARINE_LICENCE_SITE_NAME

export const coordinatesEntryController = {
  options: {
    pre: [validateSiteParam]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const action = request.query.action

    return h.view(MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE, {
      ...coordinatesEntrySettings,
      backLink: getBackLink(action, siteNumber),
      cancelLink: getCancelLink(action),
      projectName: marineLicence.projectName,
      siteNumber,
      action,
      payload: {
        coordinatesEntry: siteDetails.coordinatesEntry
      }
    })
  }
}

export const coordinatesEntrySubmitController = {
  options: {
    pre: [validateSiteParam],
    validate: {
      payload: coordinatesEntrySchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const { siteNumber } = getSiteDataFromParam(request.query)
        const action = request.query.action
        return createFailAction({
          viewRoute: MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
          settings: coordinatesEntrySettings,
          errorMessages: coordinatesEntryErrorMessages,
          projectName,
          backLink: getBackLink(action, siteNumber),
          payload: request.payload,
          params: {
            cancelLink: getCancelLink(action),
            siteNumber,
            action
          }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const action = request.query.action

    if (action && payload.coordinatesEntry === siteDetails.coordinatesEntry) {
      return h.redirect(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
      )
    }

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'coordinatesEntry',
      payload.coordinatesEntry
    )

    if (action) {
      const savedSiteDetails = getSavedSiteDetails(request)
      await setSavedSiteDetails(request, h, {
        ...savedSiteDetails,
        ...(!savedSiteDetails.originalCoordinatesEntry && {
          originalCoordinatesEntry: siteDetails.coordinatesEntry
        }),
        ...(!savedSiteDetails.originalCoordinateSystem && {
          originalCoordinateSystem: siteDetails.coordinateSystem
        })
      })
      await updateMarineLicenceSiteDetailsMultiple(request, h, siteIndex, {
        coordinateSystem: null,
        coordinates: null,
        circleWidth: null
      })
      return h.redirect(
        `${marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE}?site=${siteNumber}&action=${action}`
      )
    }

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
    )
  }
}
