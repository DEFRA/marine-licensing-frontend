import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { generatePointSpecificErrorMessage } from '~/src/server/common/helpers/site-details.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'
import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84.js'

const REQUIRED_COORDINATES_COUNT = 3

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
 * Normalise coordinates for display - ensures exactly 3 coordinates with empty defaults
 * @param {Array} coordinates - Coordinate data
 * @param {string} coordinateSystem - Coordinate system type
 * @returns {Array} Array of exactly 3 coordinates
 */
export const normaliseCoordinatesForDisplay = (
  coordinates,
  coordinateSystem
) => {
  const displayCoordinates = coordinates || []

  if (displayCoordinates.length === 0) {
    return createDefaultCoordinates(coordinateSystem)
  }

  while (displayCoordinates.length < REQUIRED_COORDINATES_COUNT) {
    displayCoordinates.push(createEmptyCoordinate(coordinateSystem))
  }

  return displayCoordinates.slice(0, REQUIRED_COORDINATES_COUNT)
}

export const extractCoordinateIndexFromFieldName = (fieldName) => {
  const indexMatch = fieldName.match(/coordinates(\d+)/)
  return indexMatch ? parseInt(indexMatch[1], 10) : 0
}

export const sanitiseFieldName = (fieldPath) =>
  fieldPath.join('').replace(PATTERNS.FIELD_BRACKETS, '')

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
  const coordinateIndex = extractCoordinateIndexFromFieldName(fieldName)
  const enhancedMessage = generatePointSpecificErrorMessage(
    detail.message,
    coordinateIndex
  )

  return { fieldName, coordinateIndex, enhancedMessage }
}

export const createErrorSummary = (validationError) => {
  return validationError.details.map((detail) => {
    const { fieldName, enhancedMessage } = processErrorDetail(detail)
    return {
      href: `#${fieldName}`,
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

export const saveCoordinatesToSession = (
  request,
  coordinates,
  coordinateSystem
) => {
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

export const validateCoordinates = (
  coordinates,
  exemptionId,
  coordinateSystem
) => {
  const validationPayload = { coordinates, id: exemptionId }
  const schema = getValidationSchema(coordinateSystem)

  return schema.validate(validationPayload, { abortEarly: false })
}
