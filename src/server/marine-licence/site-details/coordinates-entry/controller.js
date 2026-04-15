import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import joi from 'joi'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getBackRoute } from './utils.js'

export const MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE =
  'templates/coordinates-entry'

const coordinatesEntrySettings = {
  pageTitle: 'How do you want to enter the site coordinates?',
  heading: 'How do you want to enter the site coordinates?'
}

export const errorMessages = {
  COORDINATES_ENTRY_REQUIRED: 'Select how you want to enter the coordinates'
}

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
      payload: joi.object({
        coordinatesEntry: joi
          .string()
          .valid('single', 'multiple')
          .required()
          .messages({
            'any.only': 'COORDINATES_ENTRY_REQUIRED',
            'string.empty': 'COORDINATES_ENTRY_REQUIRED',
            'any.required': 'COORDINATES_ENTRY_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getMarineLicenceCache(request)
        const action = request.query.action

        if (!err.details) {
          return h
            .view(MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE, {
              ...coordinatesEntrySettings,
              backLink: getBackRoute(),
              cancelLink,
              payload,
              projectName,
              siteNumber: null,
              action
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE, {
            ...coordinatesEntrySettings,
            backLink: getBackRoute(),
            cancelLink,
            payload,
            projectName,
            siteNumber: null,
            action,
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
      'coordinatesEntry',
      payload.coordinatesEntry
    )

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
    )
  }
}
