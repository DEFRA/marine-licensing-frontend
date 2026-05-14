import Boom from '@hapi/boom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

export const DELETE_ACTIVITY_VIEW_ROUTE =
  'marine-licence/site-details/delete-activity/index'

const DELETE_ACTIVITY_PAGE_TITLE =
  'Are you sure you want to delete this activity?'

export const deleteActivityController = {
  options: {
    pre: [validateSiteAndActivityParams]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const {
      siteNumber,
      siteIndex,
      activityDetailsIndex,
      activityDetailsNumber
    } = getSiteDataFromParam(request.query)

    if (activityDetailsNumber === 1) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    }

    return h.view(DELETE_ACTIVITY_VIEW_ROUTE, {
      pageTitle: DELETE_ACTIVITY_PAGE_TITLE,
      heading: DELETE_ACTIVITY_PAGE_TITLE,
      siteNumber,
      siteIndex,
      activityIndex: activityDetailsIndex,
      activityDetailsNumber,
      projectName: marineLicence.projectName,
      backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      marineLicenceRoutes
    })
  }
}

export const deleteActivitySubmitController = {
  options: {
    pre: [validateSiteAndActivityParams]
  },
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, activityIndex } = request.payload

    const parsedSiteIndex = Number.parseInt(siteIndex, 10)
    const parsedActivityIndex = Number.parseInt(activityIndex, 10)

    try {
      await authenticatedPatchRequest(
        request,
        apiRoutes.DELETE_ACTIVITY_FROM_SITE,
        {
          id: marineLicence.id,
          siteIndex: parsedSiteIndex,
          activityIndex: parsedActivityIndex
        }
      )

      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    } catch (error) {
      request.logger.error(
        {
          err: error,
          event: {
            action: 'marine-licence:delete-activity-failed',
            reference: marineLicence.id,
            reason: `siteIndex=${parsedSiteIndex} activityIndex=${parsedActivityIndex}`
          }
        },
        'Error deleting activity'
      )
      throw Boom.internal('Error deleting activity')
    }
  }
}
