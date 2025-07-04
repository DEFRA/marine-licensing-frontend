import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'
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
  // ML-19: Always show exactly 3 coordinates (no add/remove functionality)
  const coordinateCount = 3

  return {
    coordinates: coordinates || [],
    coordinateCount,
    errors,
    projectName,
    backLink,
    ...multipleCoordinatesPageData
  }
}
