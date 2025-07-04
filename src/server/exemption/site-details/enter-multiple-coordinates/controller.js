import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  getCoordinateSystem,
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { generatePointSpecificErrorMessage } from '~/src/server/common/helpers/site-details.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'
import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  generatePageContext,
  multipleCoordinatesPageData
} from './utils.js'

const REQUIRED_COORDINATES_COUNT = 3

/**
 * Convert flattened payload to nested coordinates array
 * @param {object} payload - Flattened payload from form
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {Array} Array of coordinate objects
 */
const convertPayloadToCoordinatesArray = (payload, coordinateSystem) => {
  const coordinates = []
  const fieldNames = Object.keys(payload).filter((name) =>
    name.startsWith('coordinates[')
  )

  const indices = new Set()
  fieldNames.forEach((name) => {
    const match = name.match(/coordinates\[(\d+)\]/)
    if (match) {
      indices.add(parseInt(match[1], 10))
    }
  })

  const useWGS84 = coordinateSystem === COORDINATE_SYSTEMS.WGS84

  Array.from(indices)
    .sort((a, b) => a - b)
    .forEach((index) => {
      const coordinate = {}
      if (useWGS84) {
        coordinate.latitude = payload[`coordinates[${index}][latitude]`] || ''
        coordinate.longitude = payload[`coordinates[${index}][longitude]`] || ''
      } else {
        coordinate.eastings = payload[`coordinates[${index}][eastings]`] || ''
        coordinate.northings = payload[`coordinates[${index}][northings]`] || ''
      }
      coordinates[index] = coordinate
    })

  return coordinates
}

/**
 * Get payload data from session for the current coordinate system
 * @param {object} siteDetails - Site details from session
 * @returns {object} Payload object for template
 */
const getPayload = (siteDetails) => {
  const multipleCoordinates = siteDetails.multipleCoordinates || {}
  return { coordinates: multipleCoordinates.coordinates || [] }
}

/**
 * Get the appropriate validation schema for the coordinate system
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {object} Joi validation schema
 */
const getValidationSchema = (coordinateSystem) => {
  if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
    return createWgs84MultipleCoordinatesSchema()
  } else {
    return createOsgb36MultipleCoordinatesSchema()
  }
}

/**
 * Convert array-based validation errors back to flattened field names
 * @param {object} error - Joi validation error
 * @returns {object} Converted error with flattened field names
 */
const convertArrayErrorsToFlattenedErrors = (error) => {
  if (!error.details) {
    return error
  }

  const convertedDetails = error.details.map((detail) => {
    // Convert array path like coordinates.0.latitude to coordinates[0][latitude]
    const path = detail.path
      .map((segment, index) => {
        if (index === 0) {
          return segment
        } // coordinates
        if (typeof segment === 'number') {
          return `[${segment}]`
        } // [0]
        return `[${segment}]` // [latitude]
      })
      .join('')

    return {
      ...detail,
      path: [path]
    }
  })

  return {
    ...error,
    details: convertedDetails
  }
}

// Point-specific error message generation is now handled by the site-details helper

/**
 * Handle validation failure for multiple coordinates submit
 * @param {object} request - Hapi request object
 * @param {object} h - Hapi response toolkit
 * @param {object} error - Validation error
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {object} Error response
 */
const handleValidationFailure = (request, h, error, coordinateSystem) => {
  const { payload } = request
  const exemption = getExemptionCache(request)
  const coordinates = convertPayloadToCoordinatesArray(
    payload,
    coordinateSystem
  )

  if (!error.details) {
    const context = generatePageContext({
      coordinates,
      errors: {},
      projectName: exemption.projectName,
      backLink: multipleCoordinatesPageData.backLink
    })
    return h
      .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], context)
      .takeover()
  }

  const errorSummary = error.details.map((detail) => {
    const fieldName = detail.path.join('').replace(/[[\]]/g, '')

    // Extract coordinate index from field name (e.g., "coordinates0latitude" -> 0)
    const indexMatch = fieldName.match(/coordinates(\d+)/)
    const coordinateIndex = indexMatch ? parseInt(indexMatch[1], 10) : 0

    const enhancedMessage = generatePointSpecificErrorMessage(
      detail.message,
      coordinateIndex
    )

    return {
      href: `#${fieldName}`,
      text: enhancedMessage
    }
  })

  const errors = {}
  error.details.forEach((detail) => {
    const fieldName = detail.path.join('').replace(/[[\]]/g, '')

    // Extract coordinate index from field name
    const indexMatch = fieldName.match(/coordinates(\d+)/)
    const coordinateIndex = indexMatch ? parseInt(indexMatch[1], 10) : 0

    const enhancedMessage = generatePointSpecificErrorMessage(
      detail.message,
      coordinateIndex
    )

    errors[fieldName] = { text: enhancedMessage }
  })

  const context = generatePageContext({
    coordinates,
    errors,
    projectName: exemption.projectName,
    backLink: multipleCoordinatesPageData.backLink
  })

  return h
    .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...context,
      errorSummary
    })
    .takeover()
}

/**
 * Create a new coordinate based on the coordinate system
 * @param {string} coordinateSystem - The coordinate system to use
 * @returns {object} New empty coordinate object
 */
const createNewCoordinate = (coordinateSystem) => {
  const useWGS84 =
    coordinateSystem === COORDINATE_SYSTEMS.WGS84 || !coordinateSystem
  return useWGS84
    ? { latitude: '', longitude: '' }
    : { eastings: '', northings: '' }
}

/**
 * A GDS styled page controller for the multiple coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const multipleCoordinatesController = {
  options: {},
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    const siteDetails = exemption?.siteDetails ?? {}
    const payload = getPayload(siteDetails)

    // Always display exactly the required coordinates for ML-19 (no add/remove functionality)
    let coordinatesForDisplay = payload.coordinates || []
    if (coordinatesForDisplay.length === 0) {
      coordinatesForDisplay = Array.from(
        { length: REQUIRED_COORDINATES_COUNT },
        () => createNewCoordinate(coordinateSystem)
      )
    }

    // Ensure we always have exactly the required coordinates
    while (coordinatesForDisplay.length < REQUIRED_COORDINATES_COUNT) {
      coordinatesForDisplay.push(createNewCoordinate(coordinateSystem))
    }
    // Only show first required coordinates
    coordinatesForDisplay = coordinatesForDisplay.slice(
      0,
      REQUIRED_COORDINATES_COUNT
    )

    const context = generatePageContext({
      coordinates: coordinatesForDisplay,
      errors: {},
      projectName: exemption?.projectName,
      backLink: multipleCoordinatesPageData.backLink
    })

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], context)
  }
}

/**
 * A GDS styled page controller for the POST route in the multiple coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const multipleCoordinatesSubmitController = {
  options: {},
  handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    // Convert flattened payload to nested structure for validation
    const coordinates = convertPayloadToCoordinatesArray(
      payload,
      coordinateSystem
    )
    const validationPayload = {
      coordinates,
      id: exemption.id
    }

    // Validate using the simplified schema
    const schema = getValidationSchema(coordinateSystem)
    const validationResult = schema.validate(validationPayload, {
      abortEarly: false
    })

    if (validationResult.error) {
      // Convert array errors back to flattened field names for display
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

    // ML-19 AC6: Save coordinates to session but remain on same page (no backend submission)
    updateExemptionSiteDetails(request, 'multipleCoordinates', {
      coordinates
    })

    // Return to same page with saved data displayed
    const updatedExemption = getExemptionCache(request)
    const updatedSiteDetails = updatedExemption?.siteDetails ?? {}
    const updatedPayload = getPayload(updatedSiteDetails)

    // Ensure exactly the required coordinates for display
    let coordinatesForDisplay = updatedPayload.coordinates || coordinates
    while (coordinatesForDisplay.length < REQUIRED_COORDINATES_COUNT) {
      coordinatesForDisplay.push(createNewCoordinate(coordinateSystem))
    }
    coordinatesForDisplay = coordinatesForDisplay.slice(
      0,
      REQUIRED_COORDINATES_COUNT
    )

    const context = generatePageContext({
      coordinates: coordinatesForDisplay,
      errors: {},
      projectName: updatedExemption?.projectName,
      backLink: multipleCoordinatesPageData.backLink
    })

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], context)
  }
}
