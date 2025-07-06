import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay,
  multipleCoordinatesPageData,
  getSessionPayload,
  convertPayloadToCoordinatesArray,
  validateCoordinates,
  convertArrayErrorsToFlattenedErrors,
  handleValidationFailure,
  saveCoordinatesToSession
} from './utils.js'

export const multipleCoordinatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const siteDetails = exemption?.siteDetails ?? {}

    // Get coordinate system from session cache
    const coordinateSystem =
      siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? COORDINATE_SYSTEMS.OSGB36
        : COORDINATE_SYSTEMS.WGS84

    const payload = getSessionPayload(siteDetails, coordinateSystem)

    const coordinatesForDisplay = normaliseCoordinatesForDisplay(
      payload.coordinates,
      coordinateSystem
    )

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      coordinates: coordinatesForDisplay,
      projectName: exemption?.projectName
    })
  }
}

export const multipleCoordinatesSubmitController = {
  options: {},
  handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    // Handle missing exemption
    if (!exemption) {
      return h
        .view(MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84], {
          ...multipleCoordinatesPageData,
          coordinates: [],
          projectName: undefined
        })
        .takeover()
    }

    // Convert form value to coordinate system constant
    const coordinateSystem =
      payload.coordinateSystem === 'OSGB36'
        ? COORDINATE_SYSTEMS.OSGB36
        : COORDINATE_SYSTEMS.WGS84

    const coordinates = convertPayloadToCoordinatesArray(
      payload,
      coordinateSystem
    )

    // Handle missing or invalid exemption id
    if (!exemption.id) {
      return handleValidationFailure(
        request,
        h,
        { error: 'Missing exemption id' },
        coordinateSystem
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
