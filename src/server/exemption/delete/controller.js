import {
  authenticatedRequest,
  authenticatedGetRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  getExemptionCache,
  setExemptionCache,
  clearExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import Boom from '@hapi/boom'

export const DELETE_EXEMPTION_VIEW_ROUTE = 'exemption/delete/index'
const DELETE_EXEMPTION_PAGE_TITLE =
  'Are you sure you want to delete this project?'
export const deleteExemptionController = {
  handler: async (request, h) => {
    const exemption = getExemptionCache(request)
    const { id: exemptionId } = exemption

    if (!exemptionId) {
      throw Boom.notFound('Exemption not found')
    }

    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `/exemption/${exemptionId}`
      )
      const project = payload.value

      if (!project) {
        return h.redirect(routes.DASHBOARD)
      }

      return h.view(DELETE_EXEMPTION_VIEW_ROUTE, {
        pageTitle: DELETE_EXEMPTION_PAGE_TITLE,
        heading: DELETE_EXEMPTION_PAGE_TITLE,
        projectName: project.projectName,
        exemptionId,
        backLink: '/home',
        routes
      })
    } catch (error) {
      request.logger.error({ err: error }, 'Error fetching project for delete')

      return h.redirect(routes.DASHBOARD)
    }
  }
}
export const deleteExemptionSelectController = {
  async handler(request, h) {
    const { exemptionId } = request.params
    await clearExemptionCache(request, h)
    await setExemptionCache(request, h, { id: exemptionId })
    return h.redirect(routes.DELETE_EXEMPTION)
  }
}
export const deleteExemptionSubmitController = {
  handler: async (request, h) => {
    try {
      const { exemptionId } = request.payload
      const exemption = getExemptionCache(request)
      const { id: cachedExemptionId } = exemption

      if (!exemptionId || exemptionId !== cachedExemptionId) {
        request.logger.error(
          {
            formExemptionId: exemptionId,
            cachedExemptionId
          },
          'Exemption ID mismatch or missing'
        )
        return h.redirect(routes.DASHBOARD)
      }

      await authenticatedRequest(request, 'DELETE', `/exemption/${exemptionId}`)

      request.logger.info({ exemptionId }, `Deleted exemption ${exemptionId}`)

      await clearExemptionCache(request, h)

      return h.redirect(routes.DASHBOARD)
    } catch (error) {
      request.logger.error({ err: error }, 'Error deleting exemption')
      return h.redirect(routes.DASHBOARD)
    }
  }
}
