import {
  authenticatedRequest,
  authenticatedGetRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getExemptionCache,
  setExemptionCache,
  clearExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import Boom from '@hapi/boom'

export const DELETE_EXEMPTION_VIEW_ROUTE = 'exemption/delete/index'
const DELETE_EXEMPTION_PAGE_TITLE =
  'Are you sure you want to delete this project?'

/**
 * Controller for the delete exemption confirmation page.
 * Gets exemption ID from session cache instead of URL params.
 * @satisfies {Partial<ServerRoute>}
 */
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
      request.logger.error('Error fetching project for delete:', error)

      return h.redirect(routes.DASHBOARD)
    }
  }
}

/**
 * Controller for selecting an exemption and redirecting to the delete page.
 * Sets the exemption ID in session cache.
 */
export const deleteExemptionSelectController = {
  handler(request, h) {
    const { exemptionId } = request.params
    clearExemptionCache(request)
    setExemptionCache(request, { id: exemptionId })
    return h.redirect(routes.DELETE_EXEMPTION)
  }
}

/**
 * Controller for handling the request to actually delete an exemption.
 * @satisfies {Partial<ServerRoute>}
 */
export const deleteExemptionSubmitController = {
  handler: async (request, h) => {
    try {
      const { exemptionId } = request.payload
      const exemption = getExemptionCache(request)
      const { id: cachedExemptionId } = exemption

      if (!exemptionId || exemptionId !== cachedExemptionId) {
        request.logger.error('Exemption ID mismatch or missing:', {
          formExemptionId: exemptionId,
          cachedExemptionId
        })
        return h.redirect(routes.DASHBOARD)
      }

      await authenticatedRequest(request, 'DELETE', `/exemption/${exemptionId}`)

      request.logger.info(`Deleted exemption ${exemptionId}`)

      clearExemptionCache(request)

      return h.redirect(routes.DASHBOARD)
    } catch (error) {
      request.logger.error('Error deleting exemption:', error)
      return h.redirect(routes.DASHBOARD)
    }
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
