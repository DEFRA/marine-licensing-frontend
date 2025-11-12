import { routes } from '#src/server/common/constants/routes.js'
import {
  getExemptionCache,
  resetExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

export const DELETE_ALL_SITES_VIEW_ROUTE =
  'exemption/site-details/delete-all-sites/index'
const DELETE_ALL_SITES_PAGE_TITLE =
  'Are you sure you want to delete all site details?'

export const deleteAllSitesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { siteDetails } = exemption

    if (!siteDetails || siteDetails.length === 0) {
      return h.redirect(routes.TASK_LIST)
    }

    return h.view(DELETE_ALL_SITES_VIEW_ROUTE, {
      pageTitle: DELETE_ALL_SITES_PAGE_TITLE,
      heading: DELETE_ALL_SITES_PAGE_TITLE,
      backLink: routes.REVIEW_SITE_DETAILS,
      routes
    })
  }
}

export const deleteAllSitesSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { siteDetails } = exemption

    try {
      if (!siteDetails || siteDetails.length === 0) {
        return h.redirect(routes.TASK_LIST)
      }

      await authenticatedPatchRequest(request, '/exemption/site-details', {
        multipleSiteDetails: {},
        siteDetails: [],
        id: exemption.id
      })

      await resetExemptionSiteDetails(request, h)

      return h.redirect(routes.TASK_LIST)
    } catch (error) {
      request.logger.error(
        {
          error,
          exemptionId: exemption.id
        },
        'Error deleting all sites'
      )
      return h.redirect(routes.REVIEW_SITE_DETAILS)
    }
  }
}
