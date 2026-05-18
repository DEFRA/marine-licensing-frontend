import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { circleWidthValidationSchema } from '#src/server/common/schemas/circle-width.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import {
  WIDTH_OF_SITE_VIEW_ROUTE,
  widthOfSiteSettings,
  widthOfSiteErrorMessages
} from '#src/server/common/validation/width-of-site/constants.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'

const widthOfSitePageData = {
  ...widthOfSiteSettings,
  backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT
}

export const widthOfSiteController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber, siteDetails } = request.site
    const action = request.query.action

    return h.view(WIDTH_OF_SITE_VIEW_ROUTE, {
      ...widthOfSitePageData,
      cancelLink: getCancelLink(action),
      projectName: marineLicence.projectName,
      siteNumber,
      action,
      payload: {
        width: siteDetails?.circleWidth
      }
    })
  }
}

export const widthOfSiteSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: circleWidthValidationSchema,
      failAction: (request, h, err) => {
        const marineLicence = getMarineLicenceCache(request)
        const { projectName } = marineLicence
        const { siteNumber } = getSiteDataFromParam(request.query)
        const action = request.query.action
        return createFailAction({
          viewRoute: WIDTH_OF_SITE_VIEW_ROUTE,
          settings: widthOfSiteSettings,
          errorMessages: widthOfSiteErrorMessages,
          backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
          projectName,
          payload: request.payload,
          params: {
            cancelLink: getCancelLink(action),
            siteNumber,
            action
          }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const { siteIndex } = request.site

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'circleWidth',
      payload.width.trim()
    )

    await saveSiteDetailsToBackend(request, h)

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE)
  }
}
