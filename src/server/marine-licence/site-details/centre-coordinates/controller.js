import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'
import { getPayload } from '#src/server/marine-licence/site-details/centre-coordinates/utils.js'
import { validateCentreCoordinates } from '#src/server/marine-licence/site-details/centre-coordinates/validate.js'

export const COORDINATE_SYSTEM_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]:
    'marine-licence/site-details/centre-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]:
    'marine-licence/site-details/centre-coordinates/osgb36'
}

const centreCoordinatesPageData = {
  pageTitle: 'Enter the coordinates at the centre point of the site',
  heading: 'Enter the coordinates at the centre point of the site',
  backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
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

const getCoordinateSystem = (marineLicence) => {
  const siteDetails = getSiteDetailsBySite(marineLicence)
  return siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
    ? COORDINATE_SYSTEMS.OSGB36
    : COORDINATE_SYSTEMS.WGS84
}

const getBackLinkForAction = (action, request) => {
  if (action) {
    const savedSiteDetails = request.yar.get('savedSiteDetails') || {}
    if (savedSiteDetails.originalCoordinateSystem) {
      return `${marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE}?action=${action}`
    }
    return marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
  }
  return centreCoordinatesPageData.backLink
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
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const siteDetails = getSiteDetailsBySite(marineLicence)
    const coordinateSystem = getCoordinateSystem(marineLicence)
    const action = request.query.action

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
      ...centreCoordinatesPageData,
      backLink: getBackLinkForAction(action, request),
      cancelLink: getCancelLink(action),
      projectName: marineLicence.projectName,
      siteNumber: null,
      action,
      buttonText: getButtonText(action, request),
      payload: getPayload(siteDetails, coordinateSystem)
    })
  }
}

export const centreCoordinatesSubmitFailHandler = (request, h, error) => {
  const { payload } = request
  const marineLicence = getMarineLicenceCache(request)
  const coordinateSystem = getCoordinateSystem(marineLicence)
  const { projectName } = marineLicence
  const action = request.query.action

  if (!error.details) {
    return h
      .view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
        ...centreCoordinatesPageData,
        backLink: getBackLinkForAction(action, request),
        cancelLink: getCancelLink(action),
        projectName,
        siteNumber: null,
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
      backLink: getBackLinkForAction(action, request),
      cancelLink: getCancelLink(action),
      projectName,
      siteNumber: null,
      action,
      buttonText: getButtonText(action, request),
      payload,
      errors,
      errorSummary
    })
    .takeover()
}

export const centreCoordinatesSubmitController = {
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)
    const coordinateSystem = getCoordinateSystem(marineLicence)
    const action = request.query.action

    const { error, value } = validateCentreCoordinates(
      payload,
      coordinateSystem
    )

    if (error) {
      return centreCoordinatesSubmitFailHandler(request, h, error)
    }

    await updateMarineLicenceSiteDetails(request, h, 0, 'coordinates', value)

    if (action) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    }

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
  }
}
