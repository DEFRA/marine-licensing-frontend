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
 * Generate template context for multiple coordinates page
 * @param {object} options - Page options
 * @param {object} options.errors - Validation errors
 * @param {string} options.projectName - Project name
 * @param {string} options.backLink - Back link URL
 * @returns {object} Template context
 */
export const generatePageContext = ({ errors, projectName, backLink }) => {
  return {
    errors,
    projectName,
    backLink,
    ...multipleCoordinatesPageData
  }
}
