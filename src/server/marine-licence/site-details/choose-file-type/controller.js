import {
  getMarineLicenceCache,
  getSingleSiteMode,
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
import {
  getChooseFileTypeBackLink,
  getChooseFileTypeCancelLink
} from '#src/server/marine-licence/site-details/choose-file-type/utils.js'

export const MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE =
  'templates/choose-file-type'

export const chooseFileTypeController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const site = getSiteDetailsBySite(marineLicence)
    const isSingleSiteMode = getSingleSiteMode(request)

    const payload = {
      fileUploadType:
        isSingleSiteMode || !site.fileUploadType ? '' : site.fileUploadType
    }

    return h.view(MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE, {
      ...chooseFileTypeSettings,
      backLink: getChooseFileTypeBackLink(isSingleSiteMode),
      cancelLink: getChooseFileTypeCancelLink(isSingleSiteMode),
      projectName: marineLicence.projectName,
      payload
    })
  }
}

export const chooseFileTypeSubmitController = {
  options: {
    validate: {
      payload: chooseFileTypeSchema,
      failAction: (request, h, err) => {
        const { payload } = request
        const marineLicence = getMarineLicenceCache(request)
        const { projectName } = marineLicence
        const isSingleSiteMode = getSingleSiteMode(request)
        const backLink = getChooseFileTypeBackLink(isSingleSiteMode)
        const cancelLink = getChooseFileTypeCancelLink(isSingleSiteMode)

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
