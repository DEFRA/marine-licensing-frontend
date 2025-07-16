import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'

export const getSiteDetailsBackLink = (previousPage) => {
  if (!previousPage || !URL.canParse(previousPage)) {
    return routes.TASK_LIST
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  if (previousPath === routes.WIDTH_OF_SITE) {
    return routes.WIDTH_OF_SITE
  }

  if (previousPath === routes.ENTER_MULTIPLE_COORDINATES) {
    return routes.ENTER_MULTIPLE_COORDINATES
  }

  return routes.TASK_LIST
}

export const getReviewSummaryText = (siteDetails) => {
  const { coordinatesEntry, coordinatesType } = siteDetails

  if (coordinatesEntry === 'single' && coordinatesType === 'coordinates') {
    return 'Manually enter one set of coordinates and a width to create a circular site'
  }

  if (coordinatesEntry === 'multiple' && coordinatesType === 'coordinates') {
    return 'Manually enter multiple sets of coordinates to mark the boundary of the site'
  }

  return ''
}

export const getCoordinateSystemText = (coordinateSystem) => {
  if (!coordinateSystem) {
    return ''
  }

  return coordinateSystem === COORDINATE_SYSTEMS.WGS84
    ? 'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
    : 'OSGB36 (National Grid)\nEastings and Northings'
}

export const getCoordinateDisplayText = (siteDetails, coordinateSystem) => {
  const { coordinates } = siteDetails

  if (!coordinates || !coordinateSystem) {
    return ''
  }

  return coordinateSystem === COORDINATE_SYSTEMS.WGS84
    ? `${coordinates.latitude}, ${coordinates.longitude}`
    : `${coordinates.eastings}, ${coordinates.northings}`
}
