import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
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
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const siteDetails = getSiteDetailsBySite(marineLicence)
    const action = request.query.action

    return h.view(MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE, {
      ...coordinateSystemSettings,
      backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
      cancelLink,
      projectName: marineLicence.projectName,
      siteNumber: null,
      action,
      payload: {
        coordinateSystem: siteDetails.coordinateSystem
      }
    })
  }
}

export const coordinateSystemSubmitController = {
  options: {
    validate: {
      payload: coordinateSystemSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
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
            siteNumber: null,
            action
          }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    await updateMarineLicenceSiteDetails(
      request,
      h,
      0,
      'coordinateSystem',
      payload.coordinateSystem
    )

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
    )
  }
}
