import Boom from '@hapi/boom'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import { getBackLink } from '#src/server/declaration/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

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

    // Request to follow in ML-1054
    return h.view(
      DECLARATION_VIEW_ROUTE,
      getViewContext(PROJECT_TYPE.MARINE_LICENCE)
    )
  } catch (error) {
    request.logger.error(
      { err: error, marineLicenceId: id },
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

    return h.view(DECLARATION_VIEW_ROUTE, getViewContext(type))
  }
}
