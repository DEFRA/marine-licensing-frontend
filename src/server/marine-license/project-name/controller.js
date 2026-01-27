import joi from 'joi'
import Boom from '@hapi/boom'

import { config } from '#src/config/config.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import {
  authenticatedPatchRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import {
  clearMcmsContextCache,
  getMcmsContextFromCache
} from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import {
  getMarineLicenseCache,
  setMarineLicenseCache
} from '#src/server/common/helpers/marine-license/session-cache/utils.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'
import { getBackLink } from './utils.js'

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
  handler(request, h) {
    const marineLicenseConfig = config.get('marineLicense')

    if (!marineLicenseConfig.enabled) {
      throw Boom.forbidden(marineLicenseDisabledError)
    }

    const marineLicense = getMarineLicenseCache(request)

    const isUpdate = !!marineLicense.id

    return h.view(PROJECT_NAME_VIEW_ROUTE, {
      ...projectNameViewSettings,
      backLink: getBackLink(isUpdate),
      payload: {
        projectName: marineLicense.projectName
      }
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

        const marineLicense = getMarineLicenseCache(request)
        const isUpdate = !!marineLicense.id

        if (!err.details) {
          return h
            .view(PROJECT_NAME_VIEW_ROUTE, {
              ...projectNameViewSettings,
              backLink: getBackLink(isUpdate),
              payload
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(PROJECT_NAME_VIEW_ROUTE, {
            ...projectNameViewSettings,
            backLink: getBackLink(isUpdate),
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

      const marineLicense = getMarineLicenseCache(request)

      const { organisationId, organisationName, userRelationshipType } =
        await getUserSession(request, request.state?.userSession)

      const isUpdate = !!marineLicense.id

      const mcmsContext = getMcmsContextFromCache(request)

      const { payload: responsePayload } = isUpdate
        ? await authenticatedPatchRequest(
            request,
            '/marine-license/project-name',
            {
              ...payload,
              id: marineLicense.id
            }
          )
        : await authenticatedPostRequest(
            request,
            '/marine-license/project-name',
            {
              ...payload,
              mcmsContext,
              ...(organisationId ? { organisationId, organisationName } : {}),
              userRelationshipType
            }
          )

      const { id } = isUpdate ? marineLicense : responsePayload.value

      await setMarineLicenseCache(request, h, {
        id,
        ...(!isUpdate && responsePayload.value)
      })

      clearMcmsContextCache(request)

      return h.redirect(marineLicenseRoutes.MARINE_LICENSE_TASK_LIST)
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}
      if (!details) {
        throw e
      }

      const marineLicense = getMarineLicenseCache(request)
      const isUpdate = !!marineLicense.id

      const errorSummary = mapErrorsForDisplay(details, errorMessages)

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PROJECT_NAME_VIEW_ROUTE, {
        ...projectNameViewSettings,
        backLink: getBackLink(isUpdate),
        payload,
        errors,
        errorSummary
      })
    }
  }
}
