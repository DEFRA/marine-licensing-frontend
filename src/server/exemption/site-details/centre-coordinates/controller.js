import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import {
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/session-cache/site-utils.js'
import { getCoordinateSystem } from '#src/server/common/helpers/coordinate-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { getPayload } from '#src/server/exemption/site-details/centre-coordinates/utils.js'
import { validateCentreCoordinates } from '#src/server/exemption/site-details/centre-coordinates/validate.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'

export const COORDINATE_SYSTEM_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]: 'exemption/site-details/centre-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]:
    'exemption/site-details/centre-coordinates/osgb36'
}

const centreCoordinatesPageData = {
  pageTitle: 'Enter the coordinates at the centre point of the site',
  heading: 'Enter the coordinates at the centre point of the site',
  backLink: routes.COORDINATE_SYSTEM_CHOICE
}

export const errorMessages = {
  [COORDINATE_SYSTEMS.WGS84]: {
    LATITUDE_REQUIRED: 'Enter the latitude',
    LATITUDE_LENGTH: 'Latitude must be between -90 and 90',
    LATITUDE_NON_NUMERIC: 'Latitude must be a number',
    LATITUDE_DECIMAL_PLACES:
      'Latitude must include 6 decimal places, like 55.019889',
    LONGITUDE_REQUIRED: 'Enter the longitude',
    LONGITUDE_LENGTH: 'Longitude must be between -180 and 180',
    LONGITUDE_NON_NUMERIC: 'Longitude must be a number',
    LONGITUDE_DECIMAL_PLACES:
      'Longitude must include 6 decimal places, like -1.399500'
  },
  [COORDINATE_SYSTEMS.OSGB36]: {
    EASTINGS_REQUIRED: 'Enter the eastings',
    EASTINGS_NON_NUMERIC: 'Eastings must be a number',
    EASTINGS_LENGTH: 'Eastings must be 6 digits',
    EASTINGS_POSITIVE_NUMBER:
      'Eastings must be a positive 6-digit number, like 123456',
    NORTHINGS_REQUIRED: 'Enter the northings',
    NORTHINGS_NON_NUMERIC: 'Northings must be a number',
    NORTHINGS_LENGTH: 'Northings must be 6 or 7 digits',
    NORTHINGS_POSITIVE_NUMBER:
      'Northings must be a positive 6 or 7-digit number, like 123456'
  }
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
    errorMessages[coordinateSystem]
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
