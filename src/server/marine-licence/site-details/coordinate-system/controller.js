import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails,
  updateMarineLicenceSiteDetailsMultiple,
  getSavedSiteDetails,
  setSavedSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { getSiteDetailsAnchor } from '#src/server/common/helpers/site-details/anchor-utils.js'
import { validateSiteParam } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import {
  coordinateSystemSettings,
  coordinateSystemErrorMessages
} from '#src/server/common/validation/coordinate-system/constants.js'
import { coordinateSystemSchema } from '#src/server/common/validation/coordinate-system/schema.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'

export const MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE =
  'templates/coordinate-system'

const getBackLink = (action, siteNumber, savedSiteDetails) => {
  if (action) {
    if (savedSiteDetails.originalCoordinatesEntry) {
      return `${marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE}?site=${siteNumber}&action=${action}`
    }
    return `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
  }
  return marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
}

export const coordinateSystemController = {
  options: {
    pre: [validateSiteParam]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const action = request.query.action
    const savedSiteDetails = getSavedSiteDetails(request)

    return h.view(MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE, {
      ...coordinateSystemSettings,
      backLink: getBackLink(action, siteNumber, savedSiteDetails),
      cancelLink: getCancelLink(action),
      projectName: marineLicence.projectName,
      siteNumber,
      action,
      payload: {
        coordinateSystem: siteDetails.coordinateSystem
      }
    })
  }
}

export const coordinateSystemSubmitController = {
  options: {
    pre: [validateSiteParam],
    validate: {
      payload: coordinateSystemSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const { siteNumber } = getSiteDataFromParam(request.query)
        const action = request.query.action
        const savedSiteDetails = getSavedSiteDetails(request)
        return createFailAction({
          viewRoute: MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE,
          settings: coordinateSystemSettings,
          errorMessages: coordinateSystemErrorMessages,
          projectName,
          backLink: getBackLink(action, siteNumber, savedSiteDetails),
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

    if (action && payload.coordinateSystem === siteDetails.coordinateSystem) {
      return h.redirect(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
      )
    }

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'coordinateSystem',
      payload.coordinateSystem
    )

    const { coordinatesEntry } = siteDetails
    const nextPage =
      coordinatesEntry === 'multiple'
        ? marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
        : marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT

    if (action) {
      const savedSiteDetails = getSavedSiteDetails(request)
      if (!savedSiteDetails.originalCoordinateSystem) {
        await setSavedSiteDetails(request, h, {
          ...savedSiteDetails,
          originalCoordinateSystem: siteDetails.coordinateSystem
        })
      }
      await updateMarineLicenceSiteDetailsMultiple(request, h, siteIndex, {
        coordinates: null
      })
      return h.redirect(`${nextPage}?site=${siteNumber}&action=${action}`)
    }

    return h.redirect(nextPage)
  }
}
