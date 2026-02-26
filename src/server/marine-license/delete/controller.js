import {
  authenticatedRequest,
  authenticatedGetRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import {
  routes,
  marineLicenseRoutes
} from '#src/server/common/constants/routes.js'
import {
  getMarineLicenseCache,
  setMarineLicenseCache,
  clearMarineLicenseCache
} from '#src/server/common/helpers/marine-license/session-cache/utils.js'
import Boom from '@hapi/boom'
import { MARINE_LICENCE_TYPE } from '#src/server/common/constants/marine-licence.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'

export const DELETE_MARINE_LICENSE_VIEW_ROUTE = 'marine-license/delete/index'

const DELETE_MARINE_LICENSE_PAGE_TITLE =
  'Are you sure you want to delete this project?'

export const deleteMarineLicenseController = {
  handler: async (request, h) => {
    const marineLicense = getMarineLicenseCache(request)
    const { id: marineLicenseId } = marineLicense

    if (!marineLicenseId) {
      throw Boom.notFound('Marine license not found')
    }

    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `/marine-license/${marineLicenseId}`
      )
      const project = payload.value

      if (!project) {
        return h.redirect(routes.DASHBOARD)
      }

      return h.view(DELETE_MARINE_LICENSE_VIEW_ROUTE, {
        pageTitle: DELETE_MARINE_LICENSE_PAGE_TITLE,
        heading: DELETE_MARINE_LICENSE_PAGE_TITLE,
        projectName: project.projectName,
        marineLicenseType: MARINE_LICENCE_TYPE,
        marineLicenseId,
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
export const deleteMarineLicenseSelectController = {
  async handler(request, h) {
    const { marineLicenseId } = request.params
    await clearMarineLicenseCache(request, h)
    await setMarineLicenseCache(request, h, { id: marineLicenseId })
    return h.redirect(marineLicenseRoutes.MARINE_LICENSE_DELETE)
  }
}
export const deleteMarineLicenseSubmitController = {
  handler: async (request, h) => {
    try {
      const { marineLicenseId } = request.payload
      const marineLicense = getMarineLicenseCache(request)
      const { id: cachedMarineLicenseId } = marineLicense

      if (!marineLicenseId || marineLicenseId !== cachedMarineLicenseId) {
        request.logger.error(
          {
            formMarineLicenseId: marineLicenseId,
            cachedMarineLicenseId
          },
          'Marine license ID mismatch or missing'
        )
        return h.redirect(routes.DASHBOARD)
      }

      await authenticatedRequest(
        request,
        'DELETE',
        `/marine-license/${marineLicenseId}`
      )

      const authedUser = await getUserSession(
        request,
        request.state.userSession
      )

      request.logger.info(
        { marineLicenseId },
        `Deleted marine license ${marineLicenseId} by user ${authedUser.contactId}`
      )

      await clearMarineLicenseCache(request, h)

      return h.redirect(routes.DASHBOARD)
    } catch (error) {
      request.logger.error({ err: error }, 'Error deleting marine license')
      return h.redirect(routes.DASHBOARD)
    }
  }
}
