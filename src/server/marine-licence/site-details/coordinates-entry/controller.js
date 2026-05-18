import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  coordinatesEntrySettings,
  coordinatesEntryErrorMessages
} from '#src/server/common/validation/coordinates-entry/constants.js'
import { coordinatesEntrySchema } from '#src/server/common/validation/coordinates-entry/schema.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getBackRoute } from './utils.js'

export const MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE =
  'templates/coordinates-entry'

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

export const coordinatesEntryController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber, siteDetails } = request.site
    const action = request.query.action

    return h.view(MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE, {
      ...coordinatesEntrySettings,
      backLink: getBackRoute(),
      cancelLink,
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
    pre: [setSiteDataPreHandler],
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
          backLink: getBackRoute(),
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
    const { siteIndex } = request.site

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'coordinatesEntry',
      payload.coordinatesEntry
    )

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
    )
  }
}
