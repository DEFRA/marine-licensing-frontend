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
import { getMcmsContextFromCache } from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'

const errorMessages = {
  PROJECT_NAME_REQUIRED: 'Enter the project name',
  PROJECT_NAME_MAX_LENGTH: 'Project name should be 250 characters or less'
}

export const PROJECT_NAME_VIEW_ROUTE = 'exemption/project-name/index'

const projectNameViewSettings = {
  pageTitle: 'Project name',
  heading: 'Project Name'
}
export const projectNameController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(PROJECT_NAME_VIEW_ROUTE, {
      ...projectNameViewSettings,
      payload: {
        projectName: exemption.projectName,
        backLink: routes.TASK_LIST
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

      return h.redirect(routes.TASK_LIST)
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
