import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { circleWidthValidationSchema } from '#src/server/common/schemas/circle-width.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteParam } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import {
  WIDTH_OF_SITE_VIEW_ROUTE,
  widthOfSiteSettings,
  widthOfSiteErrorMessages
} from '#src/server/common/validation/width-of-site/constants.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { getSiteDetailsAnchor } from '#src/server/common/helpers/site-details/anchor-utils.js'

const widthOfSitePageData = {
  ...widthOfSiteSettings
}

const getBackLink = (action, siteNumber) =>
  action
    ? `${marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT}?site=${siteNumber}&action=${action}`
    : marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT

export const widthOfSiteController = {
  options: {
    pre: [validateSiteParam]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const action = request.query.action

    return h.view(WIDTH_OF_SITE_VIEW_ROUTE, {
      ...widthOfSitePageData,
      backLink: getBackLink(action, siteNumber),
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
    pre: [validateSiteParam],
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
          backLink: getBackLink(action, siteNumber),
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
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'circleWidth',
      payload.width.trim()
    )

    await saveSiteDetailsToBackend(request, h)

    return h.redirect(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
    )
  }
}
