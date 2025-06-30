import { routes } from '~/src/server/common/constants/routes.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails,
  getCoordinateSystem
} from '~/src/server/common/helpers/session-cache/utils.js'
import { generatePointSpecificErrorMessage } from '~/src/server/common/helpers/site-details.js'
import {
  multipleCoordinatesPageData,
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  generatePageContext
} from './utils.js'
import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'
import { config } from '~/src/config/config.js'
import Wreck from '@hapi/wreck'
import Boom from '@hapi/boom'

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

  Array.from(indices)
    .sort()
    .forEach((index) => {
      const coordinate = {}
      if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
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
 * Convert form payload to structured format for template display
 * @param {object} payload - Raw form payload
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {object} Structured payload object for template
 */
const convertFormPayloadToStructured = (payload, coordinateSystem) => {
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

  Array.from(indices)
    .sort()
    .forEach((index) => {
      const coordinate = {}
      if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
        coordinate.latitude = payload[`coordinates[${index}][latitude]`] || ''
        coordinate.longitude = payload[`coordinates[${index}][longitude]`] || ''
      } else {
        coordinate.eastings = payload[`coordinates[${index}][eastings]`] || ''
        coordinate.northings = payload[`coordinates[${index}][northings]`] || ''
      }
      coordinates[index] = coordinate
    })

  return { coordinates }
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
  if (!error.details) return error

  const convertedDetails = error.details.map((detail) => {
    // Convert array path like coordinates.0.latitude to coordinates[0][latitude]
    const path = detail.path
      .map((segment, index) => {
        if (index === 0) return segment // coordinates
        if (typeof segment === 'number') return `[${segment}]` // [0]
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
  const structuredPayload = convertFormPayloadToStructured(
    payload,
    coordinateSystem
  )

  if (!error.details) {
    const context = generatePageContext({
      coordinates: structuredPayload.coordinates,
      errors: {},
      projectName: exemption.projectName,
      backLink: multipleCoordinatesPageData.backLink
    })
    return h
      .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], context)
      .takeover()
  }

  const errorSummary = error.details.map((detail) => {
    const fieldName = detail.path.join('').replace(/\[|\]/g, '')

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
    const fieldName = detail.path.join('').replace(/\[|\]/g, '')

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
    coordinates: structuredPayload.coordinates,
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
 * Handle removing a coordinate from the coordinates array
 * Only allow removal if index > 2 and we have more than 3 coordinates
 * @param {Array} coordinates - Current coordinates array
 * @param {string} pointIndex - Index of coordinate to remove
 * @returns {Array} Updated coordinates array
 */
const removeCoordinate = (coordinates, pointIndex) => {
  const index = parseInt(pointIndex, 10)
  if (index > 2 && coordinates.length > 3) {
    return coordinates.filter((_, i) => i !== index)
  }
  return coordinates
}

/**
 * Process coordinate actions (add/remove) and return updated coordinates
 * @param {object} siteDetails - Current site details
 * @param {string} action - Action to perform ('add' or 'remove')
 * @param {string} pointIndex - Index for remove action
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {Array} Updated coordinates array
 */
const processCoordinateAction = (
  siteDetails,
  action,
  pointIndex,
  coordinateSystem
) => {
  const multipleCoordinates = siteDetails.multipleCoordinates || {}
  let coordinates = [...(multipleCoordinates.coordinates || [])]

  if (action === 'add') {
    coordinates = [...coordinates, createNewCoordinate(coordinateSystem)]
  }

  if (action === 'remove') {
    coordinates = removeCoordinate(coordinates, pointIndex)
  }
  return coordinates
}

/**
 * Get coordinates from query parameters (for JavaScript-disabled form submissions)
 * @param {object} query - Request query parameters
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {Array} Array of coordinate objects from query parameters
 */
const getCoordinatesFromQuery = (query, coordinateSystem) => {
  const coordinates = []

  // Filter query parameters that match coordinate field pattern
  const coordinateFields = Object.keys(query).filter((key) =>
    key.startsWith('coordinates[')
  )

  if (coordinateFields.length === 0) {
    return coordinates
  }

  const indices = new Set()
  coordinateFields.forEach((fieldName) => {
    const match = fieldName.match(/coordinates\[(\d+)\]/)
    if (match) {
      indices.add(parseInt(match[1], 10))
    }
  })

  Array.from(indices)
    .sort()
    .forEach((index) => {
      const coordinate = {}
      if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
        coordinate.latitude = query[`coordinates[${index}][latitude]`] || ''
        coordinate.longitude = query[`coordinates[${index}][longitude]`] || ''
      } else {
        coordinate.eastings = query[`coordinates[${index}][eastings]`] || ''
        coordinate.northings = query[`coordinates[${index}][northings]`] || ''
      }
      coordinates[index] = coordinate
    })
  return coordinates
}

/**
 * A GDS styled page controller for the multiple coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const multipleCoordinatesController = {
  options: {},
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { action, pointIndex, ...query } = request.query || {}
    const { coordinateSystem } = getCoordinateSystem(request)

    let siteDetails = exemption?.siteDetails ?? {}

    if (action === 'add' || action === 'remove') {
      // Check if we have coordinate data in query parameters (JavaScript disabled)
      const queryCoordinates = getCoordinatesFromQuery(query, coordinateSystem)

      // Get current coordinates from session or create initial empty ones
      let currentCoordinates =
        siteDetails.multipleCoordinates?.coordinates || []

      // If we have no coordinates yet, create the minimum required (3 empty ones)
      if (currentCoordinates.length === 0) {
        currentCoordinates = [
          createNewCoordinate(coordinateSystem),
          createNewCoordinate(coordinateSystem),
          createNewCoordinate(coordinateSystem)
        ]
      }

      // Use query coordinates if available, otherwise use current coordinates
      const coordinatesToUse =
        queryCoordinates.length > 0 ? queryCoordinates : currentCoordinates

      // Create updated site details with the coordinates to use
      const updatedSiteDetails = {
        ...siteDetails,
        multipleCoordinates: {
          ...siteDetails.multipleCoordinates,
          coordinates: coordinatesToUse
        }
      }

      // Process the action on the coordinate data
      const updatedCoordinates = processCoordinateAction(
        updatedSiteDetails,
        action,
        pointIndex,
        coordinateSystem
      )

      if (exemption) {
        updateExemptionSiteDetails(request, 'multipleCoordinates', {
          coordinates: updatedCoordinates
        })
        const updatedExemption = getExemptionCache(request)
        siteDetails = updatedExemption.siteDetails ?? {}
      } else {
        siteDetails = {
          ...siteDetails,
          multipleCoordinates: {
            ...siteDetails.multipleCoordinates,
            coordinates: updatedCoordinates
          }
        }
      }
    }

    const payload = getPayload(siteDetails)

    // Ensure we always have at least 3 coordinates for display
    let coordinatesForDisplay = payload.coordinates || []
    if (coordinatesForDisplay.length === 0) {
      coordinatesForDisplay = [
        createNewCoordinate(coordinateSystem),
        createNewCoordinate(coordinateSystem),
        createNewCoordinate(coordinateSystem)
      ]
    }

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
  async handler(request, h) {
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

    updateExemptionSiteDetails(request, 'multipleCoordinates', {
      coordinates
    })

    const updatedExemption = getExemptionCache(request)
    const cachedCoordinates =
      updatedExemption.siteDetails?.multipleCoordinates?.coordinates ||
      coordinates
    try {
      const apiUrl = `${config.get('backend').apiUrl}/exemption/multiple-coordinates`
      const apiPayload = {
        id: exemption.id,
        coordinateSystem,
        coordinates: cachedCoordinates
      }

      request.logger.info(`Submitting to API: ${apiUrl}`, {
        payload: apiPayload
      })

      const { res, payload: responsePayload } = await Wreck.patch(apiUrl, {
        payload: apiPayload,
        json: true
      })

      request.logger.info(
        `Successfully submitted multiple coordinates for exemption ${exemption.id}`,
        { statusCode: res.statusCode, response: responsePayload }
      )

      return h.redirect(routes.TASK_LIST)
    } catch (e) {
      request.logger.error(
        `Error submitting multiple coordinates for exemption ${exemption.id}: ${e.message}`
      )
      throw Boom.badRequest('Error submitting multiple coordinates', e)
    }
  }
}
