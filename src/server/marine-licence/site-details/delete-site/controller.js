import Boom from '@hapi/boom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteRequiredParam } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

export const DELETE_SITE_VIEW_ROUTE =
  'marine-licence/site-details/delete-site/index'

const DELETE_SITE_PAGE_TITLE = 'Are you sure you want to delete this site?'

export const deleteSiteController = {
  options: {
    pre: [validateSiteRequiredParam]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber, siteIndex } = getSiteDataFromParam(request.query)
    const siteDetails = marineLicence.siteDetails[siteIndex]

    return h.view(DELETE_SITE_VIEW_ROUTE, {
      pageTitle: DELETE_SITE_PAGE_TITLE,
      heading: DELETE_SITE_PAGE_TITLE,
      siteNumber,
      siteIndex,
      siteName: siteDetails.siteName,
      projectName: marineLicence.projectName,
      backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      marineLicenceRoutes
    })
  }
}

export const deleteSiteSubmitController = {
  options: {
    pre: [validateSiteRequiredParam]
  },
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex } = request.payload
    const parsedSiteIndex = Number.parseInt(siteIndex, 10)

    try {
      const dataToSave = marineLicence.siteDetails.filter(
        (_, index) => index !== parsedSiteIndex
      )

      await authenticatedPatchRequest(
        request,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE_DETAILS,
        {
          id: marineLicence.id,
          siteDetails: dataToSave
        }
      )

      const redirectRoute =
        dataToSave.length === 0
          ? marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
          : marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS

      return h.redirect(redirectRoute)
    } catch (error) {
      request.logger.error(
        {
          err: error,
          event: {
            action: 'marine-licence:delete-site-failed',
            reference: marineLicence.id,
            reason: `siteIndex=${parsedSiteIndex}`
          }
        },
        'Error deleting site'
      )
      throw Boom.internal('Error deleting site')
    }
  }
}
