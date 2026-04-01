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
  chooseFileTypeSettings,
  chooseFileTypeErrorMessages
} from '#src/server/common/validation/choose-file-type/constants.js'
import { chooseFileTypeSchema } from '#src/server/common/validation/choose-file-type/schema.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'

export const MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE =
  'templates/choose-file-type'

const backLink = marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

export const chooseFileTypeController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const site = getSiteDetailsBySite(marineLicence)

    return h.view(MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE, {
      ...chooseFileTypeSettings,
      backLink,
      cancelLink,
      projectName: marineLicence.projectName,
      payload: { fileUploadType: site.fileUploadType ?? '' }
    })
  }
}

export const chooseFileTypeSubmitController = {
  options: {
    validate: {
      payload: chooseFileTypeSchema,
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getMarineLicenceCache(request)

        if (!err.details) {
          return h
            .view(MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE, {
              ...chooseFileTypeSettings,
              backLink,
              cancelLink,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(
          err.details,
          chooseFileTypeErrorMessages
        )
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE, {
            ...chooseFileTypeSettings,
            backLink,
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
      'fileUploadType',
      payload.fileUploadType
    )

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD).takeover()
  }
}
