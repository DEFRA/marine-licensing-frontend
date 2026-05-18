import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
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
import { setSiteDataPreHandler } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'

const getCoordinateSystemForSite = (siteDetails) =>
  siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
    ? COORDINATE_SYSTEMS.OSGB36
    : COORDINATE_SYSTEMS.WGS84

const getBackLinkForAction = (action) =>
  action
    ? marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    : marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE

export const multipleCoordinatesController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request) || {}
    const { projectName } = marineLicence
    const { siteNumber, siteDetails } = request.site
    const action = request.query.action

    const coordinateSystem = getCoordinateSystemForSite(siteDetails)

    const paddedCoordinates = normaliseCoordinatesForDisplay(
      coordinateSystem,
      siteDetails.coordinates
    )

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      backLink: getBackLinkForAction(action),
      cancelLink: getCancelLink(action),
      coordinates: paddedCoordinates,
      projectName,
      siteNumber,
      action
    })
  }
}

export const multipleCoordinatesSubmitController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber, siteDetails } = request.site
    const coordinateSystem = getCoordinateSystemForSite(siteDetails)

    let coordinates = convertPayloadToCoordinatesArray(
      payload,
      coordinateSystem
    )

    if (payload.remove) {
      coordinates = removeCoordinateAtIndex(
        coordinates,
        Number.parseInt(payload.remove)
      )
    }

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
        multipleCoordinatesPageData
      )
    }

    let validatedCoordinates = validationResult.value.coordinates
    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'coordinates',
      validatedCoordinates
    )

    if (payload.add) {
      const emptyCoordinate =
        coordinateSystem === COORDINATE_SYSTEMS.OSGB36
          ? { easting: '', northing: '' }
          : { latitude: '', longitude: '' }

      validatedCoordinates = [...validatedCoordinates, emptyCoordinate]

      return renderMultipleCoordinatesView(
        h,
        validatedCoordinates,
        coordinateSystem,
        multipleCoordinatesPageData,
        marineLicence?.projectName,
        siteNumber
      )
    }

    if (payload.remove) {
      return renderMultipleCoordinatesView(
        h,
        validatedCoordinates,
        coordinateSystem,
        multipleCoordinatesPageData,
        marineLicence?.projectName,
        siteNumber
      )
    }

    await saveSiteDetailsToBackend(request, h)

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
    )
  }
}
