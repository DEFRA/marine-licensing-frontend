import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import {
  authenticatedPostRequest,
  authenticatedPatchRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { routes } from '#src/server/common/constants/routes.js'

import joi from 'joi'
import {
  isMcmsContextInCache,
  getMcmsContextFromCache,
  clearMcmsContextCache
} from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'

const errorMessages = {
  PROJECT_NAME_REQUIRED: 'Enter the project name',
  PROJECT_NAME_MAX_LENGTH: 'Project name should be 250 characters or less'
}

export const PROJECT_NAME_VIEW_ROUTE = 'exemption/project-name/index'

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers ? routes.CHECK_YOUR_ANSWERS : routes.TASK_LIST
}

const projectNameViewSettings = {
  pageTitle: 'Project name',
  heading: 'Project Name'
}

export const projectNameController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    // if it's a new exemption (rather than editing an existing one), and
    // there's no MCMS context in the cache, redirect to the dashboard page
    if (!exemption.id && !isMcmsContextInCache(request)) {
      return h.redirect(routes.DASHBOARD)
    }

    const backLink = getBackLink(request)

    return h.view(PROJECT_NAME_VIEW_ROUTE, {
      ...projectNameViewSettings,
      backLink,
      payload: {
        projectName: exemption.projectName
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
        const { payload } = request

        const backLink = getBackLink(request)

        if (!err.details) {
          return h
            .view(PROJECT_NAME_VIEW_ROUTE, {
              ...projectNameViewSettings,
              backLink,
              payload: {
                ...payload
              }
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(PROJECT_NAME_VIEW_ROUTE, {
            ...projectNameViewSettings,
            backLink,
            payload: {
              ...payload
            },
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
      const exemption = getExemptionCache(request)
      const { organisationId, organisationName, userRelationshipType } =
        await getUserSession(request, request.state?.userSession)

      const isUpdate = !!exemption.id
      const mcmsContext = getMcmsContextFromCache(request)
      const { payload: responsePayload } = isUpdate
        ? await authenticatedPatchRequest(request, '/exemption/project-name', {
            ...payload,
            id: exemption.id
          })
        : await authenticatedPostRequest(request, '/exemption/project-name', {
            ...payload,
            mcmsContext,
            ...(organisationId ? { organisationId, organisationName } : {}),
            userRelationshipType
          })

      await setExemptionCache(request, h, {
        ...exemption,
        ...(!isUpdate && responsePayload.value),
        projectName: payload.projectName
      })

      const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
      clearMcmsContextCache(request)
      return h.redirect(
        fromCheckYourAnswers ? routes.CHECK_YOUR_ANSWERS : routes.TASK_LIST
      )
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}

      if (!details) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)

      const errors = errorDescriptionByFieldName(errorSummary)

      const backLink = getBackLink(request)

      return h.view(PROJECT_NAME_VIEW_ROUTE, {
        ...projectNameViewSettings,
        backLink,
        payload,
        errors,
        errorSummary
      })
    }
  }
}
