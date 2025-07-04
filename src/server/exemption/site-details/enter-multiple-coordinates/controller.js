import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'
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

// === CONSTANTS ===

const REQUIRED_COORDINATES_COUNT = 3

const COORDINATE_FIELDS = {
  WGS84: {
    primary: 'latitude',
    secondary: 'longitude'
  },
  OSGB36: {
    primary: 'eastings',
    secondary: 'northings'
  }
}

const PATTERNS = {
  COORDINATES_PREFIX: 'coordinates[',
  COORDINATE_INDEX: /coordinates\[(\d+)\]/,
  FIELD_BRACKETS: /[[\]]/g
}

// === COORDINATE SYSTEM UTILITIES ===

const isWGS84 = (coordinateSystem) =>
  coordinateSystem === COORDINATE_SYSTEMS.WGS84

const getCoordinateFields = (coordinateSystem) =>
  isWGS84(coordinateSystem) ? COORDINATE_FIELDS.WGS84 : COORDINATE_FIELDS.OSGB36

const createEmptyCoordinate = (coordinateSystem) => {
  const fields = getCoordinateFields(coordinateSystem)
  return { [fields.primary]: '', [fields.secondary]: '' }
}

// === FIELD PROCESSING UTILITIES ===

const extractCoordinateIndices = (fieldNames) => {
  const indices = new Set()
  fieldNames.forEach((name) => {
    const match = name.match(PATTERNS.COORDINATE_INDEX)
    if (match) {
      indices.add(parseInt(match[1], 10))
    }
  })
  return Array.from(indices).sort((a, b) => a - b)
}

const extractCoordinateIndexFromFieldName = (fieldName) => {
  const indexMatch = fieldName.match(/coordinates(\d+)/)
  return indexMatch ? parseInt(indexMatch[1], 10) : 0
}

const sanitiseFieldName = (fieldPath) =>
  fieldPath.join('').replace(PATTERNS.FIELD_BRACKETS, '')

const buildCoordinateFromPayload = (payload, index, coordinateSystem) => {
  const fields = getCoordinateFields(coordinateSystem)
  return {
    [fields.primary]: payload[`coordinates[${index}][${fields.primary}]`] || '',
    [fields.secondary]:
      payload[`coordinates[${index}][${fields.secondary}]`] || ''
  }
}

const convertPayloadToCoordinatesArray = (payload, coordinateSystem) => {
  const coordinates = []
  const fieldNames = Object.keys(payload).filter((name) =>
    name.startsWith(PATTERNS.COORDINATES_PREFIX)
  )

  const indices = extractCoordinateIndices(fieldNames)

  indices.forEach((index) => {
    coordinates[index] = buildCoordinateFromPayload(
      payload,
      index,
      coordinateSystem
    )
  })

  return coordinates
}

// === COORDINATE DISPLAY UTILITIES ===

const createDefaultCoordinates = (coordinateSystem) => {
  return Array.from({ length: REQUIRED_COORDINATES_COUNT }, () =>
    createEmptyCoordinate(coordinateSystem)
  )
}

const normaliseCoordinatesForDisplay = (coordinates, coordinateSystem) => {
  const displayCoordinates = coordinates || []

  if (displayCoordinates.length === 0) {
    return createDefaultCoordinates(coordinateSystem)
  }

  while (displayCoordinates.length < REQUIRED_COORDINATES_COUNT) {
    displayCoordinates.push(createEmptyCoordinate(coordinateSystem))
  }

  return displayCoordinates.slice(0, REQUIRED_COORDINATES_COUNT)
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

// === CONTEXT UTILITIES ===

const createPageContextWithDefaults = (coordinates, errors, exemption) => {
  return generatePageContext({
    coordinates,
    errors,
    projectName: exemption?.projectName,
    backLink: multipleCoordinatesPageData.backLink
  })
}

const handleValidationFailure = (request, h, error, coordinateSystem) => {
  const { payload } = request
  const exemption = getExemptionCache(request)
  const coordinates = convertPayloadToCoordinatesArray(
    payload,
    coordinateSystem
  )

  if (!error.details) {
    const errorContext = createPageContextWithDefaults(
      coordinates,
      {},
      exemption
    )
    return h
      .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], errorContext)
      .takeover()
  }

  const errorSummary = createErrorSummary(error)
  const errors = createFieldErrors(error)

  const context = createPageContextWithDefaults(coordinates, errors, exemption)

  return h
    .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...context,
      errorSummary
    })
    .takeover()
}

// === SESSION UTILITIES ===

const getSessionPayload = (siteDetails) => {
  const multipleCoordinates = siteDetails.multipleCoordinates || {}
  return { coordinates: multipleCoordinates.coordinates || [] }
}

const saveCoordinatesToSession = (request, coordinates) => {
  updateExemptionSiteDetails(request, 'multipleCoordinates', { coordinates })
}

// === VALIDATION WORKFLOW ===

const validateCoordinates = (coordinates, exemptionId, coordinateSystem) => {
  const validationPayload = { coordinates, id: exemptionId }
  const schema = getValidationSchema(coordinateSystem)

  return schema.validate(validationPayload, { abortEarly: false })
}

// === MAIN CONTROLLERS ===

export const multipleCoordinatesController = {
  options: {},
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)
    const siteDetails = exemption?.siteDetails ?? {}
    const payload = getSessionPayload(siteDetails)

    const coordinatesForDisplay = normaliseCoordinatesForDisplay(
      payload.coordinates,
      coordinateSystem
    )

    const context = createPageContextWithDefaults(
      coordinatesForDisplay,
      {},
      exemption
    )
    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], context)
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

    saveCoordinatesToSession(request, coordinates)

    const updatedExemption = getExemptionCache(request)
    const updatedSiteDetails = updatedExemption?.siteDetails ?? {}
    const updatedPayload = getSessionPayload(updatedSiteDetails)

    const coordinatesForDisplay = normaliseCoordinatesForDisplay(
      updatedPayload.coordinates || coordinates,
      coordinateSystem
    )

    const context = createPageContextWithDefaults(
      coordinatesForDisplay,
      {},
      updatedExemption
    )
    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], context)
  }
}
