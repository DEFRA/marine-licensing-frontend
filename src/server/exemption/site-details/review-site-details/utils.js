import Boom from '@hapi/boom'
import { config } from '~/src/config/config.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { createSiteDetailsDataJson } from '~/src/server/common/helpers/site-details.js'
import { formatDate } from '~/src/server/common/helpers/dates/date-utils.js'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-details-utils.js'
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

export const getSiteDetailsBackLink = (previousPage, coordinatesEntry) => {
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

const getFileTypeText = (fileUploadType) => {
  const typeMap = { kml: 'KML', shapefile: 'Shapefile' }
  const fileType = typeMap[fileUploadType]

  if (!fileType) {
    throw new Error('Unsupported file type for site details')
  }

  return fileType
}

export const getFileUploadBackLink = (previousPage) => {
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

/**
 * Builds summary data for manual coordinate entry display
 * @param {object} siteDetails - Site details from exemption
 * @param {object} multipleSiteDetails - Multiple site configuration
 * @returns {object} Summary data for template
 */
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

/**
 * Builds summary data for displaying multiple site information
 * @param {object} multipleSiteDetails - Multiple site details from exemption
 * @param {Array} siteDetails - Site details from exemption
 * @returns {object} Summary data for template
 */
export const buildMultipleSitesSummaryData = (
  multipleSiteDetails,
  siteDetails
) => {
  if (!siteDetails?.[0]) {
    return {}
  }

  const { multipleSitesEnabled, sameActivityDates, sameActivityDescription } =
    multipleSiteDetails ?? {}

  const multipleSiteData = {
    multipleSiteDetails: multipleSitesEnabled ? 'Yes' : 'No',
    sameActivityDates: sameActivityDates === 'yes' ? 'Yes' : 'No',
    sameActivityDescription: sameActivityDescription === 'yes' ? 'Yes' : 'No'
  }

  const firstSite = siteDetails[0]

  multipleSiteData.method =
    firstSite.coordinatesType === 'coordinates'
      ? 'Enter the coordinates of the site manually'
      : 'Upload a file with the coordinates of the site'

  if (sameActivityDates === 'yes') {
    multipleSiteData.activityDates = `${formatDate(firstSite.activityDates?.start)} to ${formatDate(firstSite.activityDates?.end)}`
  }

  if (sameActivityDescription === 'yes') {
    multipleSiteData.activityDescription = firstSite.activityDescription
  }

  if (firstSite.coordinatesType === 'file') {
    multipleSiteData.fileType = getFileTypeText(firstSite.fileUploadType)
    multipleSiteData.filename = firstSite.uploadedFile.filename
  }

  return multipleSiteData
}

/**
 * Loads site details from DB when session data is incomplete
 * @param {object} request - Hapi request object
 * @param {object} exemption - Current exemption from session
 * @param {Function} authenticatedGetRequest - Function to make authenticated API calls
 * @returns {Promise<object>} Site details object
 */
export const getSiteDetails = async (
  request,
  exemption,
  authenticatedGetRequest
) => {
  let siteDetails = exemption.siteDetails

  // If we have an exemption ID but incomplete site details, load from DB
  if (exemption.id && exemption.siteDetails === undefined) {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `/exemption/${exemption.id}`
      )
      if (payload?.value?.siteDetails) {
        siteDetails = payload.value.siteDetails
        request.logger.info(
          {
            exemptionId: exemption.id,
            coordinatesType: siteDetails[0].coordinatesType
          },
          'Loaded site details from MongoDB for display'
        )
      } else {
        request.logger.warn(
          {
            exemptionId: exemption.id
          },
          'No site details found in MongoDB response'
        )
        // Continue with session data when no site details found
      }
    } catch (error) {
      request.logger.error(
        {
          error: error.message,
          exemptionId: exemption.id
        },
        'Failed to load exemption data from MongoDB'
      )
    }
  }

  return siteDetails
}

/**
 * Prepares file upload data for saving to MongoDB
 * @param {object} siteDetails - Site details from exemption
 * @param {object} request - Hapi request object for logging
 * @returns {object} Formatted data for API submission
 */
export const prepareFileUploadDataForSave = (siteDetails, request) => {
  const dataToSave = []

  for (const site of siteDetails) {
    const uploadedFile = site.uploadedFile
    const geoJSON = site.geoJSON
    const featureCount = site.featureCount || 0

    const siteToSave = {
      coordinatesType: 'file',
      activityDates: site.activityDates,
      activityDescription: site.activityDescription,
      fileUploadType: site.fileUploadType,
      geoJSON,
      featureCount,
      uploadedFile: {
        filename: uploadedFile.filename
      },
      s3Location: {
        s3Bucket: site.s3Location.s3Bucket,
        s3Key: site.s3Location.s3Key,
        checksumSha256: site.s3Location.checksumSha256
      }
    }

    request.logger.info(
      {
        fileType: site.fileUploadType,
        featureCount,
        filename: uploadedFile.filename
      },
      'Saving file upload site details'
    )

    dataToSave.push(siteToSave)
  }

  return dataToSave
}

/**
 * Prepares manual coordinate data for saving to MongoDB
 * @param {object} exemption - Current exemption from session
 * @param {object} request - Hapi request object for logging
 * @returns {object} Formatted data for API submission
 */
export const prepareManualCoordinateDataForSave = (exemption, request) => {
  for (const site of exemption.siteDetails) {
    request.logger.info(
      {
        coordinatesType: site.coordinatesType,
        coordinatesEntry: site.coordinatesEntry
      },
      'Saving manual coordinate site details'
    )
  }

  // Manual coordinate entry flow - use existing data structure
  return exemption.siteDetails
}

/**
 * Handles file upload review view rendering
 * @param {object} h - Hapi response toolkit
 * @param {object} options - Rendering options
 * @param {object} options.exemption - Current exemption from session
 * @param {object} options.siteDetails - Site details object
 * @param {string} options.previousPage - Previous page URL for back link
 * @param {object} options.reviewSiteDetailsPageData - Common page data
 * @returns {object} Rendered view response
 */
export const renderFileUploadReview = (h, options) => {
  const { exemption, previousPage, siteDetails, reviewSiteDetailsPageData } =
    options
  const { multipleSiteDetails } = exemption

  const multipleSiteDetailsData = buildMultipleSitesSummaryData(
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
    backLink: getFileUploadBackLink(previousPage),
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

/**
 * Handles manual coordinate review view rendering
 * @param {object} h - Hapi response toolkit
 * @param {object} options - Rendering options
 * @param {object} options.exemption - Current exemption from session
 * @param {object} options.siteDetails - Site details object
 * @param {string} options.previousPage - Previous page URL for back link
 * @param {object} options.reviewSiteDetailsPageData - Common page data
 * @returns {object} Rendered view response
 */
export const renderManualCoordinateReview = (h, options) => {
  const { exemption, previousPage, siteDetails, reviewSiteDetailsPageData } =
    options
  const { multipleSiteDetails } = exemption

  const firstSite = getSiteDetailsBySite(exemption)

  const summaryData = buildManualCoordinateSummaryData(
    siteDetails,
    multipleSiteDetails
  )

  const multipleSiteDetailsData = buildMultipleSitesSummaryData(
    multipleSiteDetails,
    exemption.siteDetails
  )

  return h.view(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getSiteDetailsBackLink(previousPage, firstSite.coordinatesEntry),
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

/**
 * Checks if there are any incomplete fields across all sites
 * @param {Array} siteDetails - Array of site details
 * @param {object} multipleSiteDetails - Multiple site configuration
 * @returns {boolean} True if any field is incomplete, false otherwise
 */
export const hasIncompleteFields = (siteDetails, multipleSiteDetails) => {
  if (!siteDetails || siteDetails.length === 0) {
    return false
  }

  return siteDetails.some((site) =>
    hasMissingRequiredFields(site, multipleSiteDetails)
  )
}

/**
 * Handles errors during site details submission
 * @param {object} request - Hapi request object
 * @param {Error} error - The error that occurred
 * @param {string} exemptionId - ID of the exemption
 * @param {string} coordinatesType - Type of coordinates being saved
 * @returns {Boom} Standardized error response
 */
export const handleSubmissionError = (
  request,
  error,
  exemptionId,
  coordinatesType
) => {
  request.logger.error(
    {
      error: error.message,
      exemptionId,
      coordinatesType
    },
    'Error submitting site review'
  )
  return Boom.badRequest('Error submitting site review', error)
}
