import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/exemptions/session-cache/site-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { circleWidthValidationSchema } from '#src/server/common/schemas/circle-width.js'

import { routes } from '#src/server/common/constants/routes.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import {
  WIDTH_OF_SITE_VIEW_ROUTE,
  widthOfSiteSettings,
  widthOfSiteErrorMessages
} from '#src/server/common/validation/width-of-site/constants.js'

const getBackLinkForAction = (action, siteNumber, queryParams) => {
  if (action) {
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }
  return routes.CIRCLE_CENTRE_POINT + queryParams
}

export const widthOfSiteController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { site } = request
    const { siteIndex, siteNumber, queryParams } = site
    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)
    const action = request.query.action

    return h.view(WIDTH_OF_SITE_VIEW_ROUTE, {
      ...widthOfSiteSettings,
      backLink: getBackLinkForAction(action, siteNumber, queryParams),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      siteNumber: exemption.multipleSiteDetails?.multipleSitesEnabled
        ? siteNumber
        : null,
      action,
      payload: {
        width: siteDetails.circleWidth
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
        const { payload } = request
        const exemption = getExemptionCache(request)
        const { projectName } = exemption
        const action = request.query.action

        const site = setSiteData(request)
        const { queryParams, siteNumber } = site

        const siteNumberDisplay = exemption.multipleSiteDetails
          ?.multipleSitesEnabled
          ? siteNumber
          : null

        if (!err.details) {
          return h
            .view(WIDTH_OF_SITE_VIEW_ROUTE, {
              ...widthOfSiteSettings,
              backLink: getBackLinkForAction(action, siteNumber, queryParams),
              cancelLink: getCancelLink(action),
              payload,
              projectName,
              siteNumber: siteNumberDisplay,
              action
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(
          err.details,
          widthOfSiteErrorMessages
        )
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(WIDTH_OF_SITE_VIEW_ROUTE, {
            ...widthOfSiteSettings,
            backLink: getBackLinkForAction(action, siteNumber, queryParams),
            cancelLink: getCancelLink(action),
            payload,
            projectName,
            siteNumber: siteNumberDisplay,
            action,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const { siteIndex, siteNumber, queryParams } = request.site
    const action = request.query.action

    await updateExemptionSiteDetails(
      request,
      h,
      siteIndex,
      'circleWidth',
      payload.width.trim()
    )

    const nextRoute = action
      ? `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
      : routes.REVIEW_SITE_DETAILS + queryParams

    await saveSiteDetailsToBackend(request, h)

    return h.redirect(nextRoute)
  }
}
