import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteParam } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import {
  coordinateSystemSettings,
  coordinateSystemErrorMessages
} from '#src/server/common/validation/coordinate-system/constants.js'
import { coordinateSystemSchema } from '#src/server/common/validation/coordinate-system/schema.js'

export const MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE =
  'templates/coordinate-system'

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

export const coordinateSystemController = {
  options: {
    pre: [validateSiteParam]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const action = request.query.action

    return h.view(MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE, {
      ...coordinateSystemSettings,
      backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
      cancelLink,
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
        return createFailAction({
          viewRoute: MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE,
          settings: coordinateSystemSettings,
          errorMessages: coordinateSystemErrorMessages,
          projectName,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
          payload: request.payload,
          params: {
            cancelLink,
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
    const { siteIndex } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'coordinateSystem',
      payload.coordinateSystem
    )

    const { coordinatesEntry } = siteDetails

    if (coordinatesEntry === 'single') {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT)
    }

    if (coordinatesEntry === 'multiple') {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
      )
    }

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT)
  }
}
