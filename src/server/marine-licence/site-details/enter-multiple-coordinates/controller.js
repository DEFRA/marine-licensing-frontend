import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay,
  multipleCoordinatesPageData,
  convertPayloadToCoordinatesArray,
  convertArrayErrorsToFlattenedErrors,
  handleValidationFailure,
  removeCoordinateAtIndex
} from './utils.js'
import { validateCoordinates } from '#src/server/common/validation/multiple-coordinates/validate.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'

const getBackLinkForAction = (action) =>
  action
    ? marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    : marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE

export const multipleCoordinatesController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request) || {}
    const { projectName } = marineLicence
    const action = request.query.action
    const siteDetails = getSiteDetailsBySite(marineLicence)

    const coordinateSystem =
      siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? COORDINATE_SYSTEMS.OSGB36
        : COORDINATE_SYSTEMS.WGS84

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
      siteNumber: null,
      action
    })
  }
}

function renderMultipleCoordinatesView(
  h,
  coordinates,
  coordinateSystem,
  projectName
) {
  const paddedCoordinates = normaliseCoordinatesForDisplay(
    coordinateSystem,
    coordinates
  )
  return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
    ...multipleCoordinatesPageData,
    coordinates: paddedCoordinates,
    projectName
  })
}

export const multipleCoordinatesSubmitController = {
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)
    const siteDetails = getSiteDetailsBySite(marineLicence)
    const coordinateSystem =
      siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? COORDINATE_SYSTEMS.OSGB36
        : COORDINATE_SYSTEMS.WGS84

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
      0,
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
        marineLicence?.projectName
      )
    }

    if (payload.remove) {
      return renderMultipleCoordinatesView(
        h,
        validatedCoordinates,
        coordinateSystem,
        marineLicence?.projectName
      )
    }

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
    )
  }
}
