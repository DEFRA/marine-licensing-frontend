import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  coordinatesTypeSettings,
  coordinatesTypeErrorMessages,
  coordinatesTypeSchema
} from '#src/server/common/validation/coordinates-type/constants.js'

export const MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE =
  'templates/coordinates-type'

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

export const coordinatesTypeController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    const siteDetails = marineLicence.siteDetails ?? {}

    return h.view(MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE, {
      ...coordinatesTypeSettings,
      backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
      cancelLink,
      projectName: marineLicence.projectName,
      payload: {
        coordinatesType: siteDetails.coordinatesType
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
    const marineLicence = getMarineLicenceCache(request)

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      siteDetails: {
        ...marineLicence.siteDetails,
        coordinatesType: payload.coordinatesType
      }
    })

    return h
      .redirect(marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE)
      .takeover()
  }
}
