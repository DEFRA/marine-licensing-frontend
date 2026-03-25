import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  chooseFileTypeSettings,
  chooseFileTypeErrorMessages
} from '#src/server/common/validation/choose-file-type/constants.js'
import { chooseFileTypeSchema } from '#src/server/common/validation/choose-file-type/schema.js'

export const CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE = 'templates/choose-file-type'

const cancelLink = '/exemption/task-list?cancel=site-details'

export const chooseFileTypeController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const site = getSiteDetailsBySite(exemption)

    return h.view(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
      ...chooseFileTypeSettings,
      payload: { fileUploadType: site.fileUploadType || '' },
      projectName: exemption.projectName,
      backLink: routes.COORDINATES_TYPE_CHOICE,
      cancelLink
    })
  }
}

export const chooseFileTypeSubmitController = {
  options: {
    validate: {
      payload: chooseFileTypeSchema,
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getExemptionCache(request)

        if (!err.details) {
          return h
            .view(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
              ...chooseFileTypeSettings,
              payload,
              projectName,
              backLink: routes.COORDINATES_TYPE_CHOICE,
              cancelLink
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(
          err.details,
          chooseFileTypeErrorMessages
        )
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
            ...chooseFileTypeSettings,
            payload,
            projectName,
            backLink: routes.COORDINATES_TYPE_CHOICE,
            cancelLink,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    await updateExemptionSiteDetails(
      request,
      h,
      0,
      'fileUploadType',
      payload.fileUploadType
    )

    return h.redirect(routes.FILE_UPLOAD)
  }
}
