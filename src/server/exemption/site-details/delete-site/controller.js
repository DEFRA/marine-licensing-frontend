import { routes } from '~/src/server/common/constants/routes.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { setSiteDataPreHandler } from '~/src/server/common/helpers/session-cache/site-utils.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'

export const DELETE_SITE_VIEW_ROUTE = 'exemption/site-details/delete-site/index'
const DELETE_SITE_PAGE_TITLE = 'Are you sure you want to delete this site?'

/**
 * Controller for the delete site confirmation page.
 * Uses setSiteDataPreHandler to get site data from the URL.
 * @satisfies {Partial<ServerRoute>}
 */
export const deleteSiteController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const { site } = request
    const { siteNumber } = site

    return h.view(DELETE_SITE_VIEW_ROUTE, {
      pageTitle: DELETE_SITE_PAGE_TITLE,
      heading: DELETE_SITE_PAGE_TITLE,
      siteNumber,
      backLink: routes.REVIEW_SITE_DETAILS,
      routes
    })
  }
}

/**
 * Controller for handling the request to actually delete a site.
 * @satisfies {Partial<ServerRoute>}
 */
export const deleteSiteSubmitController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { site } = request
    const { siteNumber, siteIndex } = site

    try {
      const dataToSave = exemption.siteDetails.filter(
        (_, index) => index !== siteIndex
      )

      await authenticatedPatchRequest(request, '/exemption/site-details', {
        multipleSiteDetails: exemption.multipleSiteDetails,
        siteDetails: dataToSave,
        id: exemption.id
      })

      request.logger.info(
        { siteNumber, exemptionId: exemption.id },
        `Deleted site ${siteNumber}`
      )

      const redirectRoute =
        dataToSave.length === 0 ? routes.TASK_LIST : routes.REVIEW_SITE_DETAILS

      return h.redirect(redirectRoute)
    } catch (error) {
      request.logger.error(
        { error, siteNumber, exemptionId: exemption.id },
        'Error deleting site'
      )
      return h.redirect(routes.REVIEW_SITE_DETAILS)
    }
  }
}
