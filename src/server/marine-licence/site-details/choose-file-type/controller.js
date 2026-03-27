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
  chooseFileTypeSettings,
  chooseFileTypeErrorMessages
} from '#src/server/common/validation/choose-file-type/constants.js'
import { chooseFileTypeSchema } from '#src/server/common/validation/choose-file-type/schema.js'

export const MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE =
  'templates/choose-file-type'

const backLink = marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

export const chooseFileTypeController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const siteDetails = marineLicence.siteDetails ?? {}

    return h.view(MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE, {
      ...chooseFileTypeSettings,
      backLink,
      cancelLink,
      projectName: marineLicence.projectName,
      payload: { fileUploadType: siteDetails.fileUploadType ?? '' }
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
    const marineLicence = getMarineLicenceCache(request)

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      siteDetails: {
        ...marineLicence.siteDetails,
        fileUploadType: payload.fileUploadType
      }
    })

    return h
      .redirect(marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE)
      .takeover()
  }
}
