import Boom from '@hapi/boom'
import {
  clearMarineLicenceCache,
  getMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  getExemptionCache,
  clearExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import { getBackLink } from '#src/server/declaration/utils.js'
import {
  apiRoutes,
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'

export const DECLARATION_VIEW_ROUTE = 'declaration/index'

const getViewContext = (type) => ({
  pageTitle: 'Declaration',
  backLink: getBackLink(type)
})

export const declarationController = {
  async handler(request, h) {
    const { displayName } = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!displayName) {
      return h.redirect(routes.DASHBOARD)
    }

    const type = getProjectType(request)
    return h.view(DECLARATION_VIEW_ROUTE, getViewContext(type))
  }
}

const submitMarineLicence = async (request, h) => {
  const marineLicence = getMarineLicenceCache(request)

  if (!marineLicence?.id) {
    throw Boom.notFound('Marine licence not found')
  }

  const { id } = marineLicence
  try {
    const { displayName, email } = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!displayName || !email) {
      throw new Error(errorMessages.USER_SESSION_NOT_FOUND)
    }

    const { payload: response } = await authenticatedPostRequest(
      request,
      apiRoutes.SUBMIT_MARINE_LICENCE,
      {
        id
      }
    )

    if (response?.message === 'success' && response?.value) {
      await clearMarineLicenceCache(request, h)
      const { applicationReference } = response.value
      return h.redirect(
        `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=${encodeURIComponent(applicationReference)}`
      )
    }

    throw new Error(errorMessages.UNEXPECTED_API_RESPONSE)
  } catch (error) {
    request.logger.error(
      { err: error, marineLicenceId: id },
      errorMessages.MARINE_LICENCE_SUBMISSION_FAILED
    )
    throw Boom.badRequest(errorMessages.MARINE_LICENCE_SUBMISSION_FAILED, error)
  }
}

const submitExemption = async (request, h) => {
  const exemption = getExemptionCache(request)

  if (!exemption?.id) {
    throw Boom.notFound('Exemption not found')
  }

  const { id } = exemption
  try {
    const { displayName, email } = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!displayName || !email) {
      throw new Error(errorMessages.USER_SESSION_NOT_FOUND)
    }

    const { payload: response } = await authenticatedPostRequest(
      request,
      apiRoutes.SUBMIT_EXEMPTION,
      {
        id,
        userName: displayName,
        userEmail: email
      }
    )

    if (response?.message === 'success' && response?.value) {
      await clearExemptionCache(request, h)
      const { applicationReference } = response.value
      return h.redirect(
        `${routes.CONFIRMATION}?applicationReference=${encodeURIComponent(applicationReference)}`
      )
    }

    throw new Error(errorMessages.UNEXPECTED_API_RESPONSE)
  } catch (error) {
    request.logger.error(
      { err: error, exemptionId: id },
      errorMessages.SUBMISSION_FAILED
    )
    throw Boom.badRequest(errorMessages.SUBMISSION_FAILED, error)
  }
}

export const declarationSubmitController = {
  async handler(request, h) {
    const type = getProjectType(request)

    if (type === PROJECT_TYPE.MARINE_LICENCE) {
      return submitMarineLicence(request, h)
    }

    if (type === PROJECT_TYPE.EXEMPTION) {
      return submitExemption(request, h)
    }

    request.logger.error({ projectType: type }, 'Unknown project type')
    return h.view(DECLARATION_VIEW_ROUTE, getViewContext(type))
  }
}
