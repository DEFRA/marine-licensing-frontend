import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { generatePointSpecificErrorMessage } from '~/src/server/common/helpers/site-details.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'
import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay
} from './utils.js'

const PATTERNS = {
  FIELD_BRACKETS: /[[\]]/g
}

const multipleCoordinatesPageData = {
  heading:
    'Enter multiple sets of coordinates to mark the boundary of the site',
  backLink: routes.COORDINATE_SYSTEM_CHOICE
}

// === COORDINATE SYSTEM UTILITIES ===

const isWGS84 = (coordinateSystem) =>
  coordinateSystem === COORDINATE_SYSTEMS.WGS84

// === FIELD PROCESSING UTILITIES ===

const extractCoordinateIndexFromFieldName = (fieldName) => {
  const indexMatch = fieldName.match(/coordinates(\d+)/)
  return indexMatch ? parseInt(indexMatch[1], 10) : 0
}

const sanitiseFieldName = (fieldPath) =>
  fieldPath.join('').replace(PATTERNS.FIELD_BRACKETS, '')

const convertPayloadToCoordinatesArray = (payload, coordinateSystem) => {
  const coordinates = []
  const coordinateFields = {
    [COORDINATE_SYSTEMS.WGS84]: ['latitude', 'longitude'],
    [COORDINATE_SYSTEMS.OSGB36]: ['eastings', 'northings']
  }

  const [field1, field2] = coordinateFields[coordinateSystem] || []

  Object.keys(payload)
    .map((name) => {
      const match = name.match(/^coordinates\[(\d+)\]/)
      return match ? Number(match[1]) : null
    })
    .filter((index) => index !== null)
    .sort((a, b) => a - b)
    .forEach((index) => {
      coordinates[index] = {
        [field1]: payload[`coordinates[${index}][${field1}]`] || '',
        [field2]: payload[`coordinates[${index}][${field2}]`] || ''
      }
    })

  return coordinates
}

// === VALIDATION UTILITIES ===

const getValidationSchema = (coordinateSystem) => {
  return isWGS84(coordinateSystem)
    ? createWgs84MultipleCoordinatesSchema()
    : createOsgb36MultipleCoordinatesSchema()
}

const convertArrayErrorsToFlattenedErrors = (error) => {
  if (!error.details) {
    return error
  }

  const convertedDetails = error.details.map((detail) => {
    const path = detail.path
      .map((segment, index) => {
        if (index === 0) {
          return segment
        }
        return `[${segment}]`
      })
      .join('')

    return { ...detail, path: [path] }
  })

  return { ...error, details: convertedDetails }
}

// === ERROR PROCESSING UTILITIES ===

const processErrorDetail = (detail) => {
  const fieldName = sanitiseFieldName(detail.path)
  const coordinateIndex = extractCoordinateIndexFromFieldName(fieldName)
  const enhancedMessage = generatePointSpecificErrorMessage(
    detail.message,
    coordinateIndex
  )

  return { fieldName, coordinateIndex, enhancedMessage }
}

const createErrorSummary = (validationError) => {
  return validationError.details.map((detail) => {
    const { fieldName, enhancedMessage } = processErrorDetail(detail)
    return {
      href: `#${fieldName}`,
      text: enhancedMessage
    }
  })
}

const createFieldErrors = (validationError) => {
  const errors = {}

  validationError.details.forEach((detail) => {
    const { fieldName, enhancedMessage } = processErrorDetail(detail)
    errors[fieldName] = { text: enhancedMessage }
  })

  return errors
}

const handleValidationFailure = (request, h, error, coordinateSystem) => {
  const { payload } = request
  const exemption = getExemptionCache(request)
  const coordinates = convertPayloadToCoordinatesArray(
    payload,
    coordinateSystem
  )

  if (!error.details) {
    return h
      .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
        ...multipleCoordinatesPageData,
        coordinates,
        projectName: exemption?.projectName
      })
      .takeover()
  }

  const errorSummary = createErrorSummary(error)
  const errors = createFieldErrors(error)

  return h
    .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      coordinates,
      errors,
      projectName: exemption?.projectName,
      errorSummary
    })
    .takeover()
}

// === SESSION UTILITIES ===

const getSessionPayload = (siteDetails, coordinateSystem) => {
  const multipleCoordinates = siteDetails.multipleCoordinates || {}
  return { coordinates: multipleCoordinates[coordinateSystem] || [] }
}

const saveCoordinatesToSession = (request, coordinates, coordinateSystem) => {
  const exemption = getExemptionCache(request)
  const existingMultipleCoordinates =
    exemption?.siteDetails?.multipleCoordinates || {}

  const updatedMultipleCoordinates = {
    ...existingMultipleCoordinates,
    [coordinateSystem]: coordinates
  }

  updateExemptionSiteDetails(
    request,
    'multipleCoordinates',
    updatedMultipleCoordinates
  )
}

// === VALIDATION WORKFLOW ===

const validateCoordinates = (coordinates, exemptionId, coordinateSystem) => {
  const validationPayload = { coordinates, id: exemptionId }
  const schema = getValidationSchema(coordinateSystem)

  return schema.validate(validationPayload, { abortEarly: false })
}

// === MAIN CONTROLLERS ===

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
