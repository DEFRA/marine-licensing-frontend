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
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getBackLink } from './utils.js'

const errorMessages = {
  PROJECT_NAME_REQUIRED: 'Enter the project name',
  PROJECT_NAME_MAX_LENGTH: 'Project name should be 250 characters or less'
}
export const PROJECT_NAME_VIEW_ROUTE = 'marine-licence/project-name/index'

const projectNameViewSettings = {
  pageTitle: 'Project name',
  heading: 'Project Name'
}

const marineLicenceDisabledError = 'Marine Licence journey is not enabled'

export const projectNameController = {
  handler(request, h) {
    const marineLicenceConfig = config.get('marineLicence')

    if (!marineLicenceConfig.enabled) {
      throw Boom.forbidden(marineLicenceDisabledError)
    }

    const marineLicence = getMarineLicenceCache(request)

    const isUpdate = !!marineLicence.id

    return h.view(PROJECT_NAME_VIEW_ROUTE, {
      ...projectNameViewSettings,
      backLink: getBackLink(isUpdate),
      payload: {
        projectName: marineLicence.projectName
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
        const marineLicenceConfig = config.get('marineLicence')

        if (!marineLicenceConfig.enabled) {
          throw Boom.forbidden(marineLicenceDisabledError)
        }

        const { payload } = request

        const marineLicence = getMarineLicenceCache(request)
        const isUpdate = !!marineLicence.id

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
      const marineLicenceConfig = config.get('marineLicence')

      if (!marineLicenceConfig.enabled) {
        throw Boom.forbidden(marineLicenceDisabledError)
      }

      const marineLicence = getMarineLicenceCache(request)

      const { organisationId, organisationName, userRelationshipType } =
        await getUserSession(request, request.state?.userSession)

      const isUpdate = !!marineLicence.id

      const mcmsContext = getMcmsContextFromCache(request)

      const { payload: responsePayload } = isUpdate
        ? await authenticatedPatchRequest(
            request,
            '/marine-licence/project-name',
            {
              ...payload,
              id: marineLicence.id
            }
          )
        : await authenticatedPostRequest(
            request,
            '/marine-licence/project-name',
            {
              ...payload,
              mcmsContext,
              ...(organisationId ? { organisationId, organisationName } : {}),
              userRelationshipType
            }
          )

      const { id } = isUpdate ? marineLicence : responsePayload.value

      await setMarineLicenceCache(request, h, {
        id,
        ...(!isUpdate && responsePayload.value)
      })

      clearMcmsContextCache(request)

      const fromCheckYourAnswers = request.query?.from === 'check-your-answers'

      return h.redirect(
        fromCheckYourAnswers
          ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
          : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}
      if (!details) {
        throw e
      }

      const marineLicence = getMarineLicenceCache(request)
      const isUpdate = !!marineLicence.id

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
