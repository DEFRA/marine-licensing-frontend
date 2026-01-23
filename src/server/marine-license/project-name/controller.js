import joi from 'joi'
import Boom from '@hapi/boom'

import { config } from '#src/config/config.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  clearMcmsContextCache,
  getMcmsContextFromCache
} from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'

const errorMessages = {
  PROJECT_NAME_REQUIRED: 'Enter the project name',
  PROJECT_NAME_MAX_LENGTH: 'Project name should be 250 characters or less'
}
export const PROJECT_NAME_VIEW_ROUTE = 'marine-license/project-name/index'

const projectNameViewSettings = {
  pageTitle: 'Project name',
  heading: 'Project Name'
}

const marineLicenseDisabledError = 'Marine License journey is not enabled'

export const projectNameController = {
  handler(_request, h) {
    const marineLicenseConfig = config.get('marineLicense')

    if (!marineLicenseConfig.enabled) {
      throw Boom.forbidden(marineLicenseDisabledError)
    }

    return h.view(PROJECT_NAME_VIEW_ROUTE, {
      ...projectNameViewSettings
    })
  }
}

export const projectNameSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        projectName: joi.string().min(1).required().messages({
          'string.empty': 'PROJECT_NAME_REQUIRED'
        })
      }),
      failAction: (request, h, err) => {
        const marineLicenseConfig = config.get('marineLicense')

        if (!marineLicenseConfig.enabled) {
          throw Boom.forbidden(marineLicenseDisabledError)
        }

        const { payload } = request

        if (!err.details) {
          return h
            .view(PROJECT_NAME_VIEW_ROUTE, {
              ...projectNameViewSettings,
              payload
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(PROJECT_NAME_VIEW_ROUTE, {
            ...projectNameViewSettings,
            payload,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    try {
      const marineLicenseConfig = config.get('marineLicense')

      if (!marineLicenseConfig.enabled) {
        throw Boom.forbidden(marineLicenseDisabledError)
      }

      const { organisationId, organisationName, userRelationshipType } =
        await getUserSession(request, request.state?.userSession)

      const mcmsContext = getMcmsContextFromCache(request)

      await authenticatedPostRequest(request, '/marine-license/project-name', {
        ...payload,
        mcmsContext,
        ...(organisationId ? { organisationId, organisationName } : {}),
        userRelationshipType
      })

      clearMcmsContextCache(request)

      return h.view(PROJECT_NAME_VIEW_ROUTE, {
        ...projectNameViewSettings
      })
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}
      if (!details) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PROJECT_NAME_VIEW_ROUTE, {
        ...projectNameViewSettings,
        payload,
        errors,
        errorSummary
      })
    }
  }
}
