import { routes } from '#src/server/common/constants/routes.js'
import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/session-cache/site-utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

export const DELETE_SITE_VIEW_ROUTE = 'exemption/site-details/delete-site/index'
const DELETE_SITE_PAGE_TITLE = 'Are you sure you want to delete this site?'
export const deleteSiteController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const { site } = request
    const { siteNumber, siteIndex, siteDetails } = site

    if (!siteDetails || siteDetails.coordinatesType === 'file') {
      return h.redirect(routes.REVIEW_SITE_DETAILS)
    }

    return h.view(DELETE_SITE_VIEW_ROUTE, {
      pageTitle: DELETE_SITE_PAGE_TITLE,
      heading: DELETE_SITE_PAGE_TITLE,
      siteNumber,
      siteIndex,
      backLink: routes.REVIEW_SITE_DETAILS,
      routes
    })
  }
}
export const deleteSiteSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { siteIndex } = request.payload
    const parsedSiteIndex = Number.parseInt(siteIndex, 10)

    try {
      if (!exemption.siteDetails[parsedSiteIndex]) {
        request.logger.error(
          { siteIndex, exemptionId: exemption.id },
          'Invalid site index for deletion'
        )
        return h.redirect(routes.REVIEW_SITE_DETAILS)
      }

      const dataToSave = exemption.siteDetails.filter(
        (_, index) => index !== parsedSiteIndex
      )

      await authenticatedPatchRequest(request, '/exemption/site-details', {
        multipleSiteDetails: exemption.multipleSiteDetails,
        siteDetails: dataToSave,
        id: exemption.id
      })

      await setExemptionCache(request, h, {
        ...exemption,
        siteDetails: dataToSave
      })

      const redirectRoute =
        dataToSave.length === 0 ? routes.TASK_LIST : routes.REVIEW_SITE_DETAILS

      return h.redirect(redirectRoute)
    } catch (error) {
      request.logger.error(
        {
          err: error,
          siteIndex: parsedSiteIndex,
          exemptionId: exemption.id
        },
        'Error deleting site'
      )
      return h.redirect(routes.REVIEW_SITE_DETAILS)
    }
  }
}
