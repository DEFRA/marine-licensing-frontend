import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails,
  getSavedSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay,
  multipleCoordinatesPageData,
  convertPayloadToCoordinatesArray,
  convertArrayErrorsToFlattenedErrors,
  handleValidationFailure,
  removeCoordinateAtIndex,
  renderMultipleCoordinatesView
} from './utils.js'
import { validateCoordinates } from '#src/server/common/validation/multiple-coordinates/validate.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'
import { getCoordinateSystemBackLink } from '#src/server/marine-licence/site-details/utils/back-link.js'
import { validateSiteParam } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { getSiteDetailsAnchor } from '#src/server/common/helpers/site-details/anchor-utils.js'

const getCoordinateSystemForSite = (siteDetails) =>
  siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
    ? COORDINATE_SYSTEMS.OSGB36
    : COORDINATE_SYSTEMS.WGS84

const buildPageData = (action, siteNumber, savedSiteDetails) => ({
  ...multipleCoordinatesPageData,
  backLink: getCoordinateSystemBackLink(action, siteNumber, savedSiteDetails),
  cancelLink: getCancelLink(action),
  action
})

const parseCoordinatesFromPayload = (payload, coordinateSystem) => {
  let coordinates = convertPayloadToCoordinatesArray(payload, coordinateSystem)
  if (payload.remove) {
    coordinates = removeCoordinateAtIndex(
      coordinates,
      Number.parseInt(payload.remove)
    )
  }
  return coordinates
}

const appendEmptyCoordinateIfAdding = (
  payload,
  coordinates,
  coordinateSystem
) => {
  if (!payload.add) {
    return coordinates
  }
  const emptyCoordinate =
    coordinateSystem === COORDINATE_SYSTEMS.OSGB36
      ? { easting: '', northing: '' }
      : { latitude: '', longitude: '' }
  return [...coordinates, emptyCoordinate]
}

export const multipleCoordinatesController = {
  options: {
    pre: [validateSiteParam]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request) || {}
    const { projectName } = marineLicence
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const action = request.query.action
    const savedSiteDetails = getSavedSiteDetails(request)
    const coordinateSystem = getCoordinateSystemForSite(siteDetails)
    const paddedCoordinates = normaliseCoordinatesForDisplay(
      coordinateSystem,
      siteDetails.coordinates
    )

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...buildPageData(action, siteNumber, savedSiteDetails),
      coordinates: paddedCoordinates,
      projectName,
      siteNumber
    })
  }
}

export const multipleCoordinatesSubmitController = {
  options: {
    pre: [validateSiteParam]
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)
    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)
    const coordinateSystem = getCoordinateSystemForSite(siteDetails)
    const action = request.query.action
    const savedSiteDetails = getSavedSiteDetails(request)
    const pageData = buildPageData(action, siteNumber, savedSiteDetails)

    const coordinates = parseCoordinatesFromPayload(payload, coordinateSystem)

    const validationResult = validateCoordinates(
      coordinates,
      marineLicence.id,
      coordinateSystem
    )

    if (validationResult.error) {
      const convertedError = convertArrayErrorsToFlattenedErrors(
        validationResult.error
      )
      return handleValidationFailure(
        h,
        convertedError,
        coordinateSystem,
        coordinates,
        marineLicence?.projectName,
        pageData
      )
    }

    const validatedCoordinates = validationResult.value.coordinates
    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'coordinates',
      validatedCoordinates
    )

    if (payload.add || payload.remove) {
      const displayCoordinates = appendEmptyCoordinateIfAdding(
        payload,
        validatedCoordinates,
        coordinateSystem
      )
      return renderMultipleCoordinatesView(
        h,
        displayCoordinates,
        coordinateSystem,
        pageData,
        marineLicence?.projectName,
        siteNumber
      )
    }

    await saveSiteDetailsToBackend(request, h)

    return h.redirect(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
    )
  }
}
