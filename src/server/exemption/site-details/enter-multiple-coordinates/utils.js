import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { generatePointSpecificErrorMessage } from '~/src/server/common/helpers/site-details.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'
import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84.js'

export const REQUIRED_COORDINATES_COUNT = 3

export const PATTERNS = {
  FIELD_BRACKETS: /[[\]]/g
}

export const MULTIPLE_COORDINATES_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]:
    'exemption/site-details/enter-multiple-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]:
    'exemption/site-details/enter-multiple-coordinates/osgb36'
}

export const multipleCoordinatesPageData = {
  heading:
    'Enter multiple sets of coordinates to mark the boundary of the site',
  backLink: routes.COORDINATE_SYSTEM_CHOICE
}

export const COORDINATE_FIELDS = {
  WGS84: {
    primary: 'latitude',
    secondary: 'longitude'
  },
  OSGB36: {
    primary: 'eastings',
    secondary: 'northings'
  }
}

export const isWGS84 = (coordinateSystem) =>
  coordinateSystem === COORDINATE_SYSTEMS.WGS84

const getCoordinateFields = (coordinateSystem) =>
  isWGS84(coordinateSystem) ? COORDINATE_FIELDS.WGS84 : COORDINATE_FIELDS.OSGB36

const createEmptyCoordinate = (coordinateSystem) => {
  const fields = getCoordinateFields(coordinateSystem)
  return { [fields.primary]: '', [fields.secondary]: '' }
}

const createDefaultCoordinates = (coordinateSystem) => {
  return Array.from({ length: REQUIRED_COORDINATES_COUNT }, () =>
    createEmptyCoordinate(coordinateSystem)
  )
}

/**
 * Normalise coordinates for display - ensures minimum 3 coordinates with empty defaults
 * @param {string} coordinateSystem - Coordinate system type
 * @param {Array} coordinates - Coordinate data
 * @returns {Array} Array of all coordinates
 */
export const normaliseCoordinatesForDisplay = (
  coordinateSystem,
  coordinates = []
) => {
  if (
    coordinates.length === 0 ||
    !coordinates[0] ||
    (coordinates[0]?.latitude &&
      coordinateSystem !== COORDINATE_SYSTEMS.WGS84) ||
    (coordinates[0]?.eastings && coordinateSystem !== COORDINATE_SYSTEMS.OSGB36)
  ) {
    return createDefaultCoordinates(coordinateSystem)
  }

  while (coordinates.length < REQUIRED_COORDINATES_COUNT) {
    coordinates.push(createEmptyCoordinate(coordinateSystem))
  }

  return coordinates
}

export const extractCoordinateIndexFromFieldName = (fieldName) => {
  const indexMatch = fieldName.match(/coordinates(\d+)/)
  return indexMatch ? parseInt(indexMatch[1], 10) : 0
}

export const sanitiseFieldName = (fieldPath) =>
  fieldPath.join('').replace(PATTERNS.FIELD_BRACKETS, '')

export const sanitiseFieldId = (fieldName) =>
  fieldName
    .join('')
    .replace(PATTERNS.FIELD_BRACKETS, '')
    .replace(/(\d+)/g, '-$1-')

export const convertPayloadToCoordinatesArray = (payload, coordinateSystem) => {
  const coordinates = []
  const coordinateSystemKey = isWGS84(coordinateSystem) ? 'WGS84' : 'OSGB36'
  const fields = COORDINATE_FIELDS[coordinateSystemKey]

  const field1 = fields.primary
  const field2 = fields.secondary

  Object.keys(payload)
    .map((name) => {
      const match = /^coordinates\[(\d+)\]/.exec(name)
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

export const getValidationSchema = (coordinateSystem) => {
  return isWGS84(coordinateSystem)
    ? createWgs84MultipleCoordinatesSchema()
    : createOsgb36MultipleCoordinatesSchema()
}

export const convertArrayErrorsToFlattenedErrors = (error) => {
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

export const processErrorDetail = (detail) => {
  const fieldName = sanitiseFieldName(detail.path)
  const fieldId = sanitiseFieldId(detail.path)
  const coordinateIndex = extractCoordinateIndexFromFieldName(fieldName)
  const enhancedMessage = generatePointSpecificErrorMessage(
    detail.message,
    coordinateIndex
  )

  return { fieldName, fieldId, coordinateIndex, enhancedMessage }
}

export const createErrorSummary = (validationError) => {
  return validationError.details.map((detail) => {
    const { fieldId, enhancedMessage } = processErrorDetail(detail)
    return {
      href: `#${fieldId}`,
      text: enhancedMessage
    }
  })
}

export const createFieldErrors = (validationError) => {
  const errors = {}

  validationError.details.forEach((detail) => {
    const { fieldName, enhancedMessage } = processErrorDetail(detail)
    errors[fieldName] = { text: enhancedMessage }
  })

  return errors
}

export const handleValidationFailure = (
  request,
  h,
  error,
  coordinateSystem
) => {
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

export const validateCoordinates = (
  coordinates,
  exemptionId,
  coordinateSystem
) => {
  const validationPayload = { coordinates, id: exemptionId }
  const schema = getValidationSchema(coordinateSystem)

  return schema.validate(validationPayload, { abortEarly: false })
}

/**
 * Remove a coordinate at a given index, but only if index >= 3 and at least 3 remain after removal
 * @param {Array} coordinates - Array of coordinates
 * @param {number} index - Index to remove
 * @returns {Array} New array with coordinate removed if allowed, else original array
 */
export const removeCoordinateAtIndex = (coordinates, index) => {
  if (
    index >= REQUIRED_COORDINATES_COUNT &&
    index < coordinates.length &&
    coordinates.length > REQUIRED_COORDINATES_COUNT
  ) {
    return coordinates.slice(0, index).concat(coordinates.slice(index + 1))
  }
  return coordinates
}
