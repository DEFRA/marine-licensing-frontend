import {
  COORDINATE_SYSTEMS,
  POLYGON_MIN_COORDINATE_POINTS
} from '#src/server/common/constants/coordinate-systems.js'
import { generatePointSpecificErrorMessage } from '#src/server/common/helpers/site-details.js'

export const PATTERNS = {
  FIELD_BRACKETS: /[[\]]/g
}

export const MULTIPLE_COORDINATES_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]: 'templates/multiple-coordinates-wgs84',
  [COORDINATE_SYSTEMS.OSGB36]: 'templates/multiple-coordinates-osgb36'
}

export const COORDINATE_FIELDS = {
  WGS84: {
    primary: 'latitude',
    secondary: 'longitude'
  },
  OSGB36: {
    primary: 'easting',
    secondary: 'northing'
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

const createDefaultCoordinates = (coordinateSystem) =>
  Array.from({ length: POLYGON_MIN_COORDINATE_POINTS }, () =>
    createEmptyCoordinate(coordinateSystem)
  )

const areCoordinatesEmptyOrInvalid = (coordinates) =>
  coordinates.length === 0 || !coordinates[0]

const doesCoordinateSystemMatchData = (coordinate, coordinateSystem) => {
  const hasWgs84Fields = coordinate?.latitude !== undefined
  const hasOsgb36Fields = coordinate?.easting !== undefined

  if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
    return hasWgs84Fields
  }

  if (coordinateSystem === COORDINATE_SYSTEMS.OSGB36) {
    return hasOsgb36Fields
  }

  return false
}

const extractRelevantCoordinateFields = (coordinate, coordinateSystem) => {
  const fields = getCoordinateFields(coordinateSystem)
  return {
    [fields.primary]: coordinate[fields.primary] || '',
    [fields.secondary]: coordinate[fields.secondary] || ''
  }
}

export const normaliseCoordinatesForDisplay = (
  coordinateSystem,
  coordinates = []
) => {
  if (
    areCoordinatesEmptyOrInvalid(coordinates) ||
    !doesCoordinateSystemMatchData(coordinates[0], coordinateSystem)
  ) {
    return createDefaultCoordinates(coordinateSystem)
  }

  const normalisedCoordinates = coordinates.map((coord) =>
    extractRelevantCoordinateFields(coord, coordinateSystem)
  )

  while (normalisedCoordinates.length < POLYGON_MIN_COORDINATE_POINTS) {
    normalisedCoordinates.push(createEmptyCoordinate(coordinateSystem))
  }

  return normalisedCoordinates
}

export const extractCoordinateIndexFromFieldName = (fieldName) => {
  const indexMatch = fieldName.match(/coordinates(\d+)/)
  return indexMatch ? Number.parseInt(indexMatch[1], 10) : 0
}

export const sanitiseFieldName = (fieldPath) =>
  fieldPath.join('').replaceAll(PATTERNS.FIELD_BRACKETS, '')

export const sanitiseFieldId = (fieldName) =>
  fieldName
    .join('')
    .replaceAll(PATTERNS.FIELD_BRACKETS, '')
    .replaceAll(/(\d+)/g, '-$1-')

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

export const createErrorSummary = (validationError) =>
  validationError.details.map((detail) => {
    const { fieldId, enhancedMessage } = processErrorDetail(detail)
    return {
      href: `#${fieldId}`,
      text: enhancedMessage
    }
  })

export const createFieldErrors = (validationError) => {
  const errors = {}

  for (const detail of validationError.details) {
    const { fieldName, enhancedMessage } = processErrorDetail(detail)
    errors[fieldName] = { text: enhancedMessage }
  }

  return errors
}

export const handleValidationFailure = (
  h,
  error,
  coordinateSystem,
  coordinates,
  projectName,
  pageData
) => {
  if (!error.details) {
    return h
      .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
        ...pageData,
        coordinates,
        projectName
      })
      .takeover()
  }

  const errorSummary = createErrorSummary(error)
  const errors = createFieldErrors(error)

  return h
    .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...pageData,
      coordinates,
      errors,
      projectName,
      errorSummary
    })
    .takeover()
}

export const renderMultipleCoordinatesView = (
  h,
  coordinates,
  coordinateSystem,
  pageData,
  projectName,
  siteNumber
) => {
  const paddedCoordinates = normaliseCoordinatesForDisplay(
    coordinateSystem,
    coordinates
  )
  return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
    ...pageData,
    coordinates: paddedCoordinates,
    projectName,
    siteNumber
  })
}

export const removeCoordinateAtIndex = (coordinates, index) => {
  if (
    index >= POLYGON_MIN_COORDINATE_POINTS &&
    index < coordinates.length &&
    coordinates.length > POLYGON_MIN_COORDINATE_POINTS
  ) {
    return coordinates.slice(0, index).concat(coordinates.slice(index + 1))
  }
  return coordinates
}
