import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { circleWidthValidationSchema } from '#src/server/common/schemas/circle-width.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'
import {
  WIDTH_OF_SITE_VIEW_ROUTE,
  widthOfSiteSettings,
  widthOfSiteErrorMessages
} from '#src/server/common/validation/width-of-site/constants.js'

const widthOfSitePageData = {
  ...widthOfSiteSettings,
  backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT
}

export const widthOfSiteController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const siteDetails = getSiteDetailsBySite(marineLicence)
    const action = request.query.action

    return h.view(WIDTH_OF_SITE_VIEW_ROUTE, {
      ...widthOfSitePageData,
      cancelLink: getCancelLink(action),
      projectName: marineLicence.projectName,
      siteNumber: null,
      action,
      payload: {
        width: siteDetails?.circleWidth
      }
    })
  }
}

export const widthOfSiteSubmitFailHandler = (request, h, err) => {
  const { payload } = request
  const marineLicence = getMarineLicenceCache(request)
  const { projectName } = marineLicence
  const action = request.query.action

  if (!err.details) {
    return h
      .view(WIDTH_OF_SITE_VIEW_ROUTE, {
        ...widthOfSitePageData,
        cancelLink: getCancelLink(action),
        payload,
        projectName,
        siteNumber: null,
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
      ...widthOfSitePageData,
      cancelLink: getCancelLink(action),
      payload,
      projectName,
      siteNumber: null,
      action,
      errors,
      errorSummary
    })
    .takeover()
}

export const widthOfSiteSubmitController = {
  options: {
    validate: {
      payload: circleWidthValidationSchema,
      failAction: widthOfSiteSubmitFailHandler
    }
  },
  async handler(request, h) {
    const { payload } = request

    await updateMarineLicenceSiteDetails(
      request,
      h,
      0,
      'circleWidth',
      payload.width.trim()
    )

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE)
  }
}
