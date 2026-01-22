import Boom from '@hapi/boom'
import { config } from '#src/config/config.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { routes } from '#src/server/common/constants/routes.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'
import { formatDate } from '#src/server/common/helpers/dates/date-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import { buildSiteLocationData } from '#src/server/common/helpers/site-location-data.js'
import { getReviewSummaryText } from '#src/server/common/helpers/exemptions/exemption-site-details.js'
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

  return coord.eastings && coord.northings
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

const REVIEW_SITE_DETAILS_VIEW_ROUTE =
  'exemption/site-details/review-site-details/index'

const FILE_UPLOAD_REVIEW_VIEW_ROUTE =
  'exemption/site-details/review-site-details/file-upload-review'

export const getSiteDetailsBackLink = (
  previousPage,
  coordinatesEntry,
  returnToCheckYourAnswers = false
) => {
  if (returnToCheckYourAnswers) {
    return typeof returnToCheckYourAnswers === 'string'
      ? returnToCheckYourAnswers
      : routes.CHECK_YOUR_ANSWERS
  }

  if (!previousPage || !URL.canParse(previousPage)) {
    return routes.TASK_LIST
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  if (coordinatesEntry === 'multiple') {
    return routes.ENTER_MULTIPLE_COORDINATES
  }

  // For circular sites (single coordinate), go back to width page
  return routes.WIDTH_OF_SITE
}

export const getCoordinateSystemText = (coordinateSystem) => {
  if (!coordinateSystem) {
    return ''
  }

  return isWGS84(coordinateSystem)
    ? 'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
    : 'British National Grid (OSGB36)\nEastings and Northings'
}

export const getCoordinateDisplayText = (siteDetails, coordinateSystem) => {
  const { coordinates } = siteDetails

  if (!coordinates || !coordinateSystem) {
    return ''
  }

  return isWGS84(coordinateSystem)
    ? `${coordinates.latitude}, ${coordinates.longitude}`
    : `${coordinates.eastings}, ${coordinates.northings}`
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

export const getFileUploadSummaryData = (exemption) => {
  const siteDetails = exemption.siteDetails || {}
  const geoJSON = siteDetails.geoJSON || {}

  const coordinates = parseGeoJSONCoordinates(geoJSON)

  return {
    coordinates,
    geoJSON
  }
}

const parseGeoJSONCoordinates = (geoJSON) => {
  const features = geoJSON.features
  if (!features || !Array.isArray(features)) {
    return []
  }

  return features.filter(hasValidGeometry).map(extractCoordinateData)
}

const hasValidGeometry = (feature) => {
  const geometry = feature.geometry
  return (
    geometry?.type &&
    geometry?.coordinates &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0
  )
}

const extractCoordinateData = (feature) => ({
  type: feature.geometry.type,
  coordinates: feature.geometry.coordinates
})

export const getFileUploadBackLink = (
  previousPage,
  returnToCheckYourAnswers = false
) => {
  if (returnToCheckYourAnswers) {
    return typeof returnToCheckYourAnswers === 'string'
      ? returnToCheckYourAnswers
      : routes.CHECK_YOUR_ANSWERS
  }

  if (!previousPage || !URL.canParse(previousPage)) {
    return routes.FILE_UPLOAD
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  // If coming from task list, return to task list
  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  // Otherwise, return to correct page for file upload upload journey
  return previousPath
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

    // Generate individual site details data for the map
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
        siteDetailsData
      })
    } else {
      // Default to circular site display
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
        siteDetailsData
      })
    }
  }

  return summaryData
}

export const renderFileUploadReview = (h, options) => {
  const {
    exemption,
    previousPage,
    siteDetails,
    reviewSiteDetailsPageData,
    returnToCheckYourAnswers = false
  } = options
  const { multipleSiteDetails } = exemption

  const multipleSiteDetailsData = buildSiteLocationData(
    multipleSiteDetails,
    siteDetails
  )

  const { multipleSitesEnabled, sameActivityDates, sameActivityDescription } =
    multipleSiteDetails ?? {}

  const showActivityDates = !multipleSitesEnabled || sameActivityDates === 'no'
  const showActivityDescription =
    !multipleSitesEnabled || sameActivityDescription === 'no'

  const summaryData = siteDetails.map((site, index) => {
    const fileUploadSummaryData = getFileUploadSummaryData({
      ...exemption,
      siteDetails: site
    })

    const siteDetailsData = createSiteDetailsDataJson(site)

    return {
      ...fileUploadSummaryData,
      siteName: site.siteName,
      activityDates: getActivityDatesSummaryText(
        site.activityDates,
        showActivityDates
      ),
      activityDescription: getActivityDescriptionSummaryText(
        site.activityDescription,
        showActivityDescription
      ),
      showActivityDates,
      showActivityDescription,
      siteDetailsData,
      siteNumber: index + 1
    }
  })

  const isMultiSiteJourney = !!multipleSiteDetails?.multipleSitesEnabled

  return h.view(FILE_UPLOAD_REVIEW_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getFileUploadBackLink(previousPage, returnToCheckYourAnswers),
    projectName: exemption.projectName,
    summaryData,
    multipleSiteDetailsData,
    configEnv: config.get('env'),
    isMultiSiteJourney,
    hasIncompleteFields:
      isMultiSiteJourney &&
      hasIncompleteFields(siteDetails, multipleSiteDetails)
  })
}
export const renderManualCoordinateReview = (h, options) => {
  const {
    exemption,
    previousPage,
    siteDetails,
    reviewSiteDetailsPageData,
    returnToCheckYourAnswers = false
  } = options
  const { multipleSiteDetails } = exemption

  const firstSite = getSiteDetailsBySite(exemption)

  const summaryData = buildManualCoordinateSummaryData(
    siteDetails,
    multipleSiteDetails
  )

  const multipleSiteDetailsData = buildSiteLocationData(
    multipleSiteDetails,
    exemption.siteDetails
  )

  return h.view(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getSiteDetailsBackLink(
      previousPage,
      firstSite.coordinatesEntry,
      returnToCheckYourAnswers
    ),
    projectName: exemption.projectName,
    summaryData,
    multipleSiteDetailsData,
    isMultiSiteJourney: !!multipleSiteDetails?.multipleSitesEnabled
  })
}

const hasMissingRequiredFields = (site, multipleSiteDetails) => {
  const { sameActivityDates, sameActivityDescription } =
    multipleSiteDetails ?? {}

  const isSiteNameMissing = !site.siteName || site.siteName.trim() === ''
  const areActivityDatesMissing =
    sameActivityDates === 'no' &&
    (!site.activityDates?.start || !site.activityDates?.end)
  const isActivityDescriptionMissing =
    sameActivityDescription === 'no' &&
    (!site.activityDescription || site.activityDescription.trim() === '')

  return (
    isSiteNameMissing || areActivityDatesMissing || isActivityDescriptionMissing
  )
}

export const hasIncompleteFields = (siteDetails, multipleSiteDetails) => {
  if (!siteDetails || siteDetails.length === 0) {
    return false
  }

  return siteDetails.some((site) =>
    hasMissingRequiredFields(site, multipleSiteDetails)
  )
}

export const handleSubmissionError = (
  request,
  error,
  exemptionId,
  coordinatesType
) => {
  request.logger.error(
    {
      err: error,
      exemptionId,
      coordinatesType
    },
    'Error submitting site review'
  )
  return Boom.badRequest('Error submitting site review', error)
}
