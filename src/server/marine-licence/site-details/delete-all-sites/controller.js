import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

const DELETE_ALL_SITES_VIEW_ROUTE = 'templates/delete-all-sites'
const DELETE_ALL_SITES_PAGE_TITLE =
  'Are you sure you want to delete all site details?'

export const deleteAllSitesController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteDetails } = marineLicence

    if (!siteDetails || siteDetails.length === 0) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    return h.view(DELETE_ALL_SITES_VIEW_ROUTE, {
      pageTitle: DELETE_ALL_SITES_PAGE_TITLE,
      heading: DELETE_ALL_SITES_PAGE_TITLE,
      backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      projectName: marineLicence.projectName
    })
  }
}

export const deleteAllSitesSubmitController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteDetails } = marineLicence

    try {
      if (!siteDetails || siteDetails.length === 0) {
        return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
      }

      await authenticatedPatchRequest(
        request,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE_DETAILS,
        {
          id: marineLicence.id,
          siteDetails: []
        }
      )

      await setMarineLicenceCache(request, h, {
        id: marineLicence.id,
        siteDetails: []
      })

      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    } catch (error) {
      request.logger.error(
        {
          err: error,
          event: {
            action: 'marine-licence:delete-all-sites-failed',
            reference: marineLicence.id
          }
        },
        'Error deleting all sites'
      )
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    }
  }
}
