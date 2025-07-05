import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'

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

// === COORDINATE SYSTEM UTILITIES ===

const isWGS84 = (coordinateSystem) =>
  coordinateSystem === COORDINATE_SYSTEMS.WGS84

const getCoordinateFields = (coordinateSystem) =>
  isWGS84(coordinateSystem) ? COORDINATE_FIELDS.WGS84 : COORDINATE_FIELDS.OSGB36

const createEmptyCoordinate = (coordinateSystem) => {
  const fields = getCoordinateFields(coordinateSystem)
  return { [fields.primary]: '', [fields.secondary]: '' }
}

// === COORDINATE DISPLAY UTILITIES ===

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

// === EXISTING EXPORTS ===

export const MULTIPLE_COORDINATES_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]:
    'exemption/site-details/enter-multiple-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]:
    'exemption/site-details/enter-multiple-coordinates/osgb36'
}
