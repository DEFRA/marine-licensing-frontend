import joi from 'joi'

import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-details-utils.js'
const pageSettings = {
  pageTitle: 'Choose file type',
  heading: 'Which type of file do you want to upload?'
}

export const CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE =
  'exemption/site-details/choose-file-type/index'

export const errorMessages = {
  FILE_TYPE_ENTRY_REQUIRED: 'Select which type of file you want to upload'
}

/**
 * A GDS styled project name page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const chooseFileTypeController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const site = getSiteDetailsBySite(exemption)

    return h.view(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
      ...pageSettings,
      payload: { fileUploadType: site.fileUploadType || '' },
      projectName: exemption.projectName,
      backLink: routes.COORDINATES_TYPE_CHOICE
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the coordinates type page.
 * @satisfies {Partial<ServerRoute>}
 */
export const chooseFileTypeSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        fileUploadType: joi
          .string()
          .valid('shapefile', 'kml')
          .required()
          .messages({
            'any.only': 'FILE_TYPE_ENTRY_REQUIRED',
            'string.empty': 'FILE_TYPE_ENTRY_REQUIRED',
            'any.required': 'FILE_TYPE_ENTRY_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getExemptionCache(request)

        if (!err.details) {
          return h
            .view(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
              ...pageSettings,
              payload,
              projectName,
              backLink: routes.COORDINATES_TYPE_CHOICE
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
            ...pageSettings,
            payload,
            projectName,
            backLink: routes.COORDINATES_TYPE_CHOICE,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload } = request

    updateExemptionSiteDetails(
      request,
      0,
      'fileUploadType',
      payload.fileUploadType
    )

    return h.redirect(routes.FILE_UPLOAD)
  }
}
