import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  coordinatesTypeSettings,
  coordinatesTypeErrorMessages
} from '#src/server/common/validation/coordinates-type/constants.js'
import { coordinatesTypeSchema } from '#src/server/common/validation/coordinates-type/schema.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'

export const MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE =
  'templates/coordinates-type'

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

export const coordinatesTypeController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const site = getSiteDetailsBySite(marineLicence)

    return h.view(MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE, {
      ...coordinatesTypeSettings,
      backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
      cancelLink,
      projectName: marineLicence.projectName,
      payload: {
        coordinatesType: site.coordinatesType
      }
    })
  }
}

export const coordinatesTypeSubmitController = {
  options: {
    validate: {
      payload: coordinatesTypeSchema,
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getMarineLicenceCache(request)

        if (!err.details) {
          return h
            .view(MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE, {
              ...coordinatesTypeSettings,
              backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
              cancelLink,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(
          err.details,
          coordinatesTypeErrorMessages
        )

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE, {
            ...coordinatesTypeSettings,
            backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
            cancelLink,
            payload,
            projectName,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    await updateMarineLicenceSiteDetails(
      request,
      h,
      0,
      'coordinatesType',
      payload.coordinatesType
    )

    if (payload.coordinatesType === 'file') {
      return h
        .redirect(marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE)
        .takeover()
    }

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_SITE_NAME).takeover()
  }
}
