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
import { validateSiteParam } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { getPayload } from '#src/server/common/helpers/site-details/centre-coordinates.js'
import { validateCentreCoordinates } from '#src/server/common/validation/centre-coordinates/validate.js'
import {
  centreCoordinatesSettings,
  centreCoordinatesErrorMessages,
  COORDINATE_SYSTEM_VIEW_ROUTES
} from '#src/server/common/validation/centre-coordinates/constants.js'

const centreCoordinatesPageData = {
  ...centreCoordinatesSettings,
  backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
}

const getCoordinateSystem = (siteDetails) =>
  siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
    ? COORDINATE_SYSTEMS.OSGB36
    : COORDINATE_SYSTEMS.WGS84

export const centreCoordinatesController = {
  options: {
    pre: [validateSiteParam]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const coordinateSystem = getCoordinateSystem(siteDetails)
    const action = request.query.action

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
      ...centreCoordinatesPageData,
      cancelLink: getCancelLink(action),
      projectName: marineLicence.projectName,
      siteNumber,
      action,
      buttonText: 'Continue',
      payload: getPayload(siteDetails, coordinateSystem)
    })
  }
}

export const centreCoordinatesSubmitFailHandler = (request, h, error) => {
  const { payload } = request
  const marineLicence = getMarineLicenceCache(request)
  const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
  const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
  const coordinateSystem = getCoordinateSystem(siteDetails)
  const { projectName } = marineLicence
  const action = request.query.action

  if (!error.details) {
    return h
      .view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
        ...centreCoordinatesPageData,
        cancelLink: getCancelLink(action),
        projectName,
        siteNumber,
        action,
        buttonText: 'Continue',
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
      cancelLink: getCancelLink(action),
      projectName,
      siteNumber,
      action,
      buttonText: 'Continue',
      payload,
      errors,
      errorSummary
    })
    .takeover()
}

export const centreCoordinatesSubmitController = {
  options: {
    pre: [validateSiteParam]
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const coordinateSystem = getCoordinateSystem(siteDetails)

    const { error, value } = validateCentreCoordinates(
      payload,
      coordinateSystem
    )

    if (error) {
      return centreCoordinatesSubmitFailHandler(request, h, error)
    }

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'coordinates',
      value
    )

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE)
  }
}
