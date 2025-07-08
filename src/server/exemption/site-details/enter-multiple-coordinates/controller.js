import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  getExemptionCache,
  getCoordinateSystem
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay,
  multipleCoordinatesPageData,
  convertPayloadToCoordinatesArray,
  validateCoordinates,
  convertArrayErrorsToFlattenedErrors,
  handleValidationFailure,
  saveCoordinatesToSession
} from './utils.js'

export const multipleCoordinatesController = {
  handler(request, h) {
    const { projectName, siteDetails = {} } = getExemptionCache(request) || {}

    const coordinateSystem =
      siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? COORDINATE_SYSTEMS.OSGB36
        : COORDINATE_SYSTEMS.WGS84

    const multipleCoordinates = siteDetails.multipleCoordinates || {}

    const coordinates = normaliseCoordinatesForDisplay(
      multipleCoordinates[coordinateSystem] || [],
      coordinateSystem
    )

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      coordinates,
      projectName
    })
  }
}

export const multipleCoordinatesSubmitController = {
  options: {},
  handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    const coordinates = convertPayloadToCoordinatesArray(
      payload,
      coordinateSystem
    )

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

    saveCoordinatesToSession(request, coordinates, coordinateSystem)

    const coordinatesForDisplay = normaliseCoordinatesForDisplay(
      coordinates,
      coordinateSystem
    )

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      coordinates: coordinatesForDisplay,
      projectName: exemption?.projectName
    })
  }
}
