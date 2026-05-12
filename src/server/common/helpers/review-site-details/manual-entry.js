import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'
import { formatDate } from '#src/server/common/helpers/dates/date-utils.js'
import { parseActivityDetails } from '#src/server/common/helpers/review-site-details/activity-details.js'

const isWGS84 = (coordinateSystem) =>
  coordinateSystem === COORDINATE_SYSTEMS.WGS84

const isValidPolygonInput = (siteDetails, coordinateSystem) => {
  if (!siteDetails || !coordinateSystem) {
    return false
  }

  const { coordinates } = siteDetails
  return coordinates && Array.isArray(coordinates)
}

const isValidCoordinateForSystem = (coord, coordinateSystem) => {
  if (!coord) {
    return false
  }

  if (isWGS84(coordinateSystem)) {
    return coord.latitude && coord.longitude
  }

  return coord.easting && coord.northing
}

const generateCoordinateLabel = (index) => {
  return index === 0 ? 'Start and end points' : `Point ${index + 1}`
}

const transformCoordinateToDisplayFormat = (coord, index, coordinateSystem) => {
  const displayText = getCoordinateDisplayText(
    { coordinates: coord },
    coordinateSystem
  )

  return {
    label: generateCoordinateLabel(index),
    value: displayText
  }
}

const metresLabel = (metres) =>
  metres === '1' ? `${metres} metre` : `${metres} metres`

const getActivityDatesSummaryText = (activityDates, showActivityDates) => {
  if (!showActivityDates) {
    return ''
  }

  if (activityDates?.start && activityDates?.end) {
    return `${formatDate(activityDates.start)} to ${formatDate(activityDates.end)}`
  }
  return ''
}

const getActivityDescriptionSummaryText = (
  activityDescription,
  showActivityDescription
) => {
  if (!showActivityDescription) {
    return ''
  }

  return activityDescription ?? ''
}

export const getCoordinateSystemText = (coordinateSystem) => {
  if (!coordinateSystem) {
    return ''
  }

  return isWGS84(coordinateSystem)
    ? 'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
    : 'OSGB36 (National Grid)\nEastings and Northings'
}

export const getCoordinateDisplayText = (siteDetails, coordinateSystem) => {
  const { coordinates } = siteDetails

  if (!coordinates || !coordinateSystem) {
    return ''
  }

  return isWGS84(coordinateSystem)
    ? `${coordinates.latitude}, ${coordinates.longitude}`
    : `${coordinates.easting}, ${coordinates.northing}`
}

export const getPolygonCoordinatesDisplayData = (
  siteDetails,
  coordinateSystem
) => {
  if (!isValidPolygonInput(siteDetails, coordinateSystem)) {
    return []
  }

  const { coordinates } = siteDetails

  const validCoordinates = coordinates.filter((coord) =>
    isValidCoordinateForSystem(coord, coordinateSystem)
  )

  return validCoordinates.map((coord, index) =>
    transformCoordinateToDisplayFormat(coord, index, coordinateSystem)
  )
}

export const getReviewSummaryText = (siteDetails) => {
  const { coordinatesEntry, coordinatesType } = siteDetails

  if (coordinatesEntry === 'single' && coordinatesType === 'coordinates') {
    return 'Manually enter one set of coordinates and a width to create a circular site'
  }

  if (coordinatesEntry === 'multiple' && coordinatesType === 'coordinates') {
    return 'Enter multiple sets of coordinates to mark the boundary of the site'
  }

  return ''
}

export const buildManualCoordinateSummaryData = (
  siteDetails,
  multipleSiteDetails = {}
) => {
  const summaryData = []

  if (!siteDetails || !Array.isArray(siteDetails)) {
    return []
  }

  for (const [index, site] of siteDetails.entries()) {
    const {
      circleWidth,
      coordinatesEntry,
      coordinateSystem,
      activityDates,
      activityDescription,
      siteName
    } = site
    const { multipleSitesEnabled, sameActivityDates, sameActivityDescription } =
      multipleSiteDetails

    const showActivityDates =
      !multipleSitesEnabled || sameActivityDates === 'no'

    const showActivityDescription =
      !multipleSitesEnabled || sameActivityDescription === 'no'

    const siteDetailsData = createSiteDetailsDataJson(site, coordinateSystem)

    if (coordinatesEntry === 'multiple') {
      summaryData.push({
        activityDates: getActivityDatesSummaryText(
          activityDates,
          showActivityDates
        ),
        activityDescription: getActivityDescriptionSummaryText(
          activityDescription,
          showActivityDescription
        ),
        showActivityDates,
        showActivityDescription,
        siteName: siteName ?? '',
        method: getReviewSummaryText(site),
        coordinateSystem: getCoordinateSystemText(coordinateSystem),
        polygonCoordinates: getPolygonCoordinatesDisplayData(
          site,
          coordinateSystem
        ),
        siteNumber: index + 1,
        siteDetailsData,
        activityDetails: parseActivityDetails(site)
      })
    } else {
      summaryData.push({
        activityDates: getActivityDatesSummaryText(
          activityDates,
          showActivityDates
        ),
        activityDescription: getActivityDescriptionSummaryText(
          activityDescription,
          showActivityDescription
        ),
        showActivityDates,
        showActivityDescription,
        siteName: siteName ?? '',
        method: getReviewSummaryText(site),
        coordinateSystem: getCoordinateSystemText(coordinateSystem),
        coordinates: getCoordinateDisplayText(site, coordinateSystem),
        width: circleWidth ? metresLabel(circleWidth) : '',
        siteNumber: index + 1,
        siteDetailsData,
        activityDetails: parseActivityDetails(site)
      })
    }
  }

  return summaryData
}
