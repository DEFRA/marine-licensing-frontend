import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'
import { getPayload } from '#src/server/common/helpers/site-details/centre-coordinates.js'
import { validateCentreCoordinates } from '#src/server/common/validation/centre-coordinates/validate.js'
import {
  centreCoordinatesSettings,
  centreCoordinatesErrorMessages
} from '#src/server/common/validation/centre-coordinates/constants.js'

export const COORDINATE_SYSTEM_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]: 'templates/centre-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]: 'templates/centre-coordinates/osgb36'
}

const centreCoordinatesPageData = {
  ...centreCoordinatesSettings,
  backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
}

const getCoordinateSystem = (marineLicence) => {
  const siteDetails = getSiteDetailsBySite(marineLicence)
  return siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
    ? COORDINATE_SYSTEMS.OSGB36
    : COORDINATE_SYSTEMS.WGS84
}

const getBackLinkForAction = () => {
  return centreCoordinatesPageData.backLink
}

const getButtonText = () => {
  return 'Continue'
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
    centreCoordinatesErrorMessages[coordinateSystem]
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

    const { error, value } = validateCentreCoordinates(
      payload,
      coordinateSystem
    )

    if (error) {
      return centreCoordinatesSubmitFailHandler(request, h, error)
    }

    await updateMarineLicenceSiteDetails(request, h, 0, 'coordinates', value)

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT)
  }
}
