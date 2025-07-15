import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  getExemptionCache,
  getCoordinateSystem,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay,
  multipleCoordinatesPageData,
  convertPayloadToCoordinatesArray,
  validateCoordinates,
  convertArrayErrorsToFlattenedErrors,
  handleValidationFailure,
  removeCoordinateAtIndex
} from './utils.js'
import { routes } from '~/src/server/common/constants/routes.js'

export const multipleCoordinatesController = {
  handler(request, h) {
    const { projectName, siteDetails = {} } = getExemptionCache(request) || {}

    const coordinateSystem =
      siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? COORDINATE_SYSTEMS.OSGB36
        : COORDINATE_SYSTEMS.WGS84

    const coordinates = normaliseCoordinatesForDisplay(
      coordinateSystem,
      siteDetails.coordinates
    )

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      coordinates,
      projectName
    })
  }
}

function renderMultipleCoordinatesView(
  h,
  coordinates,
  coordinateSystem,
  projectName
) {
  const coordinatesForDisplay = normaliseCoordinatesForDisplay(
    coordinateSystem,
    coordinates
  )
  return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
    ...multipleCoordinatesPageData,
    coordinates: coordinatesForDisplay,
    projectName
  })
}

export const multipleCoordinatesSubmitController = {
  options: {},
  handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    let coordinates = convertPayloadToCoordinatesArray(
      payload,
      coordinateSystem
    )

    if (payload.remove) {
      coordinates = removeCoordinateAtIndex(
        coordinates,
        parseInt(payload.remove)
      )
    }

    const validationResult = validateCoordinates(
      coordinates,
      exemption.id,
      coordinateSystem
    )

    if (validationResult.error) {
      const convertedError = convertArrayErrorsToFlattenedErrors(
        validationResult.error
      )
      return handleValidationFailure(
        request,
        h,
        convertedError,
        coordinateSystem
      )
    }

    updateExemptionSiteDetails(request, 'coordinates', coordinates)

    if (payload.add) {
      const emptyCoordinate =
        coordinateSystem === COORDINATE_SYSTEMS.OSGB36
          ? { eastings: '', northings: '' }
          : { latitude: '', longitude: '' }

      coordinates = [...coordinates, emptyCoordinate]
    }

    if (payload.add || payload.remove) {
      return renderMultipleCoordinatesView(
        h,
        coordinates,
        coordinateSystem,
        exemption?.projectName
      )
    }

    return h.redirect(routes.REVIEW_SITE_DETAILS)
  }
}
