import {
  authenticatedRequest,
  authenticatedGetRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  setMarineLicenceCache,
  clearMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import Boom from '@hapi/boom'
import { MARINE_LICENCE_TYPE } from '#src/server/common/constants/marine-licence.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'

export const DELETE_MARINE_LICENCE_VIEW_ROUTE = 'marine-licence/delete/index'

const DELETE_MARINE_LICENCE_PAGE_TITLE =
  'Are you sure you want to delete this project?'

export const deleteMarineLicenceController = {
  handler: async (request, h) => {
    const marineLicence = getMarineLicenceCache(request)
    const { id: marineLicenceId } = marineLicence

    if (!marineLicenceId) {
      throw Boom.notFound('Marine licence not found')
    }

    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `/marine-licence/${marineLicenceId}`
      )
      const project = payload.value

      if (!project) {
        return h.redirect(routes.DASHBOARD)
      }

      return h.view(DELETE_MARINE_LICENCE_VIEW_ROUTE, {
        pageTitle: DELETE_MARINE_LICENCE_PAGE_TITLE,
        heading: DELETE_MARINE_LICENCE_PAGE_TITLE,
        projectName: project.projectName,
        marineLicenceType: MARINE_LICENCE_TYPE,
        marineLicenceId,
        backLink: routes.DASHBOARD,
        cancelLink: routes.DASHBOARD,
        routes
      })
    } catch (error) {
      request.logger.error({ err: error }, 'Error fetching project for delete')

      return h.redirect(routes.DASHBOARD)
    }
  }
}
export const deleteMarineLicenceSelectController = {
  async handler(request, h) {
    const { marineLicenceId } = request.params
    await clearMarineLicenceCache(request, h)
    await setMarineLicenceCache(request, h, { id: marineLicenceId })
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_DELETE)
  }
}
export const deleteMarineLicenceSubmitController = {
  handler: async (request, h) => {
    try {
      const { marineLicenceId } = request.payload
      const marineLicence = getMarineLicenceCache(request)
      const { id: cachedMarineLicenceId } = marineLicence

      if (!marineLicenceId || marineLicenceId !== cachedMarineLicenceId) {
        request.logger.error(
          {
            formMarineLicenceId: marineLicenceId,
            cachedMarineLicenceId
          },
          'Marine licence ID mismatch or missing'
        )
        return h.redirect(routes.DASHBOARD)
      }

      await authenticatedRequest(
        request,
        'DELETE',
        `/marine-licence/${marineLicenceId}`
      )

      const authedUser = await getUserSession(
        request,
        request.state.userSession
      )

      request.logger.info(
        { marineLicenceId },
        `Deleted marine licence ${marineLicenceId} by user ${authedUser.contactId}`
      )

      await clearMarineLicenceCache(request, h)

      return h.redirect(routes.DASHBOARD)
    } catch (error) {
      request.logger.error({ err: error }, 'Error deleting marine licence')
      return h.redirect(routes.DASHBOARD)
    }
  }
}
