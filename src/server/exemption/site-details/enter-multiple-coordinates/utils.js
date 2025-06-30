import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'

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

/**
 * Generate coordinate fieldset data for template rendering
 * @param {object} options - Configuration options
 * @param {Array} options.coordinates - Array of coordinate objects
 * @param {object} options.errors - Validation errors object
 * @param {number} options.index - Coordinate index
 * @returns {object} Fieldset data for coordinate inputs
 */
export const generateCoordinateFieldset = ({
  coordinates = [],
  errors = {},
  index
}) => {
  const coordinate = coordinates[index] || { latitude: '', longitude: '' }
  const pointNumber = index + 1

  return {
    coordinate,
    index,
    pointNumber,
    legend: index === 0 ? 'Start and end point' : `Point ${pointNumber}`,
    latitudeError: errors[`coordinates${index}latitude`],
    longitudeError: errors[`coordinates${index}longitude`],
    isRemovable: index > 2
  }
}

/**
 * Generate template context for multiple coordinates page
 * @param {object} options - Page options
 * @param {Array} options.coordinates - Coordinate data
 * @param {object} options.errors - Validation errors
 * @param {string} options.projectName - Project name
 * @param {string} options.backLink - Back link URL
 * @returns {object} Template context
 */
export const generatePageContext = ({
  coordinates,
  errors,
  projectName,
  backLink
}) => {
  const coordinateCount = Math.max(3, coordinates.length)

  return {
    coordinates: coordinates || [],
    coordinateCount,
    errors,
    projectName,
    backLink,
    ...multipleCoordinatesPageData
  }
}
