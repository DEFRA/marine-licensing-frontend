import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  coordinatesEntrySettings,
  coordinatesEntryErrorMessages
} from '#src/server/common/validation/coordinates-entry/constants.js'
import { coordinatesEntrySchema } from '#src/server/common/validation/coordinates-entry/schema.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { getBackRoute } from './utils.js'

export const MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE =
  'templates/coordinates-entry'

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

export const coordinatesEntryController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const siteDetails = getSiteDetailsBySite(marineLicence)
    const action = request.query.action

    return h.view(MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE, {
      ...coordinatesEntrySettings,
      backLink: getBackRoute(),
      cancelLink,
      projectName: marineLicence.projectName,
      siteNumber: null,
      action,
      payload: {
        coordinatesEntry: siteDetails.coordinatesEntry
      }
    })
  }
}

export const coordinatesEntrySubmitController = {
  options: {
    validate: {
      payload: coordinatesEntrySchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const action = request.query.action
        return createFailAction({
          viewRoute: MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
          settings: coordinatesEntrySettings,
          errorMessages: coordinatesEntryErrorMessages,
          projectName,
          backLink: getBackRoute(),
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
      'coordinatesEntry',
      payload.coordinatesEntry
    )

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
    )
  }
}
