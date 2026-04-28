import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/exemptions/session-cache/site-utils.js'
import { getCoordinateSystem } from '#src/server/common/helpers/coordinate-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'
import { getPayload } from '#src/server/common/helpers/site-details/centre-coordinates.js'
import { validateCentreCoordinates } from '#src/server/common/validation/centre-coordinates/validate.js'
import {
  centreCoordinatesSettings,
  centreCoordinatesErrorMessages,
  COORDINATE_SYSTEM_VIEW_ROUTES
} from '#src/server/common/validation/centre-coordinates/constants.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'

const centreCoordinatesPageData = {
  ...centreCoordinatesSettings,
  backLink: routes.COORDINATE_SYSTEM_CHOICE
}

const getBackLinkForAction = (action, siteNumber, queryParams, request) => {
  if (action) {
    const savedSiteDetails = request.yar.get('savedSiteDetails') || {}
    if (savedSiteDetails.originalCoordinateSystem) {
      return `${routes.COORDINATE_SYSTEM_CHOICE}?site=${siteNumber}&action=${action}`
    }
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }

  return centreCoordinatesPageData.backLink + queryParams
}

const getButtonText = (action, request) => {
  if (!action) {
    return 'Continue'
  }
  const savedSiteDetails = request.yar.get('savedSiteDetails') || {}
  return savedSiteDetails.originalCoordinateSystem
    ? 'Continue'
    : 'Save and continue'
}

export const centreCoordinatesController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { siteIndex, queryParams, siteNumber } = request.site
    const { coordinateSystem } = getCoordinateSystem(request)
    const action = request.query.action

    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
      ...centreCoordinatesPageData,
      backLink: getBackLinkForAction(action, siteNumber, queryParams, request),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      siteNumber: exemption.multipleSiteDetails?.multipleSitesEnabled
        ? siteNumber
        : null,
      action,
      buttonText: getButtonText(action, request),
      payload: getPayload(siteDetails, coordinateSystem)
    })
  }
}

export const centreCoordinatesSubmitFailHandler = (request, h, error) => {
  const { payload } = request
  const site = setSiteData(request)
  const exemption = getExemptionCache(request)
  const { queryParams, siteNumber } = site
  const { coordinateSystem } = getCoordinateSystem(request)
  const { projectName } = exemption
  const action = request.query.action

  const siteNumberDisplay = exemption.multipleSiteDetails?.multipleSitesEnabled
    ? siteNumber
    : null

  if (!error.details) {
    return h
      .view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
        ...centreCoordinatesPageData,
        backLink: getBackLinkForAction(
          action,
          siteNumber,
          queryParams,
          request
        ),
        cancelLink: getCancelLink(action),
        projectName,
        siteNumber: siteNumberDisplay,
        action,
        buttonText: getButtonText(action, request),
        payload
      })
      .takeover()
  }
  const errorSummary = mapErrorsForDisplay(
    error.details,
    centreCoordinatesErrorMessages[coordinateSystem]
  )

  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
      ...centreCoordinatesPageData,
      backLink: getBackLinkForAction(action, siteNumber, queryParams, request),
      cancelLink: getCancelLink(action),
      projectName,
      siteNumber: siteNumberDisplay,
      action,
      buttonText: getButtonText(action, request),
      payload,
      errors,
      errorSummary
    })
    .takeover()
}
export const centreCoordinatesSubmitController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  async handler(request, h) {
    const { payload } = request
    const { queryParams, siteIndex, siteNumber, siteDetails } = request.site
    const action = request.query.action

    const { coordinateSystem } = getCoordinateSystem(request)

    const { error, value } = validateCentreCoordinates(
      payload,
      coordinateSystem
    )

    if (error) {
      return centreCoordinatesSubmitFailHandler(request, h, error)
    }

    await updateExemptionSiteDetails(
      request,
      h,
      siteIndex,
      'coordinates',
      value
    )

    const hasCircleWidthEntry = siteDetails.circleWidth

    const nextRoute =
      action && hasCircleWidthEntry
        ? `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
        : routes.WIDTH_OF_SITE + queryParams

    if (action && hasCircleWidthEntry) {
      await saveSiteDetailsToBackend(request, h)
    }

    return h.redirect(nextRoute)
  }
}
