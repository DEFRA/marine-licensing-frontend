import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

import joi from 'joi'

export const PROJECT_BACKGROUND_VIEW_ROUTE =
  'marine-licence/project-background/index'

export const errorMessages = {
  PROJECT_BACKGROUND_REQUIRED: 'Enter the project background',
  PROJECT_BACKGROUND_MAX_LENGTH:
    'Project background must be 1000 characters or less'
}

const projectBackgroundSettings = {
  pageTitle: 'Project background',
  heading: 'Project background'
}

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const projectBackgroundController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(PROJECT_BACKGROUND_VIEW_ROUTE, {
      ...projectBackgroundSettings,
      projectName: marineLicence.projectName,
      payload: { projectBackground: marineLicence.projectBackground },
      backLink: getBackLink(request)
    })
  }
}

export const projectBackgroundSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        projectBackground: joi.string().trim().max(1000).required().messages({
          'string.empty': errorMessages.PROJECT_BACKGROUND_REQUIRED,
          'any.required': errorMessages.PROJECT_BACKGROUND_REQUIRED,
          'string.max': errorMessages.PROJECT_BACKGROUND_MAX_LENGTH
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        const { projectName } = getMarineLicenceCache(request)
        const backLink = getBackLink(request)

        if (!err.details) {
          return h
            .view(PROJECT_BACKGROUND_VIEW_ROUTE, {
              ...projectBackgroundSettings,
              payload,
              projectName,
              backLink
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(PROJECT_BACKGROUND_VIEW_ROUTE, {
            ...projectBackgroundSettings,
            payload,
            projectName,
            backLink,
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

    try {
      await authenticatedPatchRequest(
        request,
        apiRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
        {
          projectBackground: payload.projectBackground,
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        projectBackground: payload.projectBackground
      })

      return h.redirect(getBackLink(request))
    } catch (e) {
      const validation = e.data?.payload?.validation
      const details = validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PROJECT_BACKGROUND_VIEW_ROUTE, {
        ...projectBackgroundSettings,
        payload,
        projectName: marineLicence.projectName,
        backLink: getBackLink(request),
        errors,
        errorSummary
      })
    }
  }
}
