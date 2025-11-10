import {
  COORDINATE_SYSTEMS,
  POLYGON_MIN_COORDINATE_POINTS
} from '#src/server/common/constants/exemptions.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/session-cache/site-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import { getCoordinateSystem } from '#src/server/common/helpers/coordinate-utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay,
  multipleCoordinatesPageData,
  convertPayloadToCoordinatesArray,
  convertArrayErrorsToFlattenedErrors,
  handleValidationFailure,
  removeCoordinateAtIndex
} from './utils.js'
import { validateCoordinates } from '#src/server/exemption/site-details/enter-multiple-coordinates/validation/validation.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'

const getBackLinkForAction = (action, siteNumber, queryParams, request) => {
  if (action) {
    const savedSiteDetails = request.yar.get('savedSiteDetails') || {}

    if (savedSiteDetails.originalCoordinateSystem !== undefined) {
      return `${routes.COORDINATE_SYSTEM_CHOICE}?site=${siteNumber}&action=${action}`
    }

    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }

  return routes.COORDINATE_SYSTEM_CHOICE + queryParams
}

export const multipleCoordinatesController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request) || {}
    const { projectName } = exemption
    const { site } = request
    const { siteIndex, queryParams, siteNumber } = site
    const action = request.query.action
    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    const coordinateSystem =
      siteDetails.coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? COORDINATE_SYSTEMS.OSGB36
        : COORDINATE_SYSTEMS.WGS84

    const coordinates = normaliseCoordinatesForDisplay(
      coordinateSystem,
      siteDetails.coordinates
    )

    const paddedCoordinates = [...coordinates]
    const emptyCoordinate =
      coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? { eastings: '', northings: '' }
        : { latitude: '', longitude: '' }

    while (paddedCoordinates.length < POLYGON_MIN_COORDINATE_POINTS) {
      paddedCoordinates.push({ ...emptyCoordinate })
    }

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      backLink: getBackLinkForAction(action, siteNumber, queryParams, request),
      cancelLink: getCancelLink(action),
      coordinates: paddedCoordinates,
      projectName,
      siteNumber: exemption.multipleSiteDetails?.multipleSitesEnabled
        ? siteNumber
        : null,
      action
    })
  }
}

function renderMultipleCoordinatesView(
  h,
  coordinates,
  coordinateSystem,
  projectName
) {
  const coordinatesForDisplay = normaliseCoordinatesForDisplay(
    coordinateSystem,
    coordinates
  )
  // Pad coordinates to at least 3 items
  const minCoords = 3
  const paddedCoordinates = [...coordinatesForDisplay]
  const emptyCoordinate =
    coordinateSystem === COORDINATE_SYSTEMS.OSGB36
      ? { eastings: '', northings: '' }
      : { latitude: '', longitude: '' }
  while (paddedCoordinates.length < minCoords) {
    paddedCoordinates.push({ ...emptyCoordinate })
  }
  return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
    ...multipleCoordinatesPageData,
    coordinates: paddedCoordinates,
    projectName
  })
}

export const multipleCoordinatesSubmitController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)
    const { siteIndex, queryParams, siteNumber } = request.site
    const action = request.query.action
    const { coordinateSystem } = getCoordinateSystem(request)

    let coordinates = convertPayloadToCoordinatesArray(
      payload,
      coordinateSystem
    )

    if (payload.remove) {
      coordinates = removeCoordinateAtIndex(
        coordinates,
        Number.parseInt(payload.remove)
      )
    }

    const validationResult = validateCoordinates(
      coordinates,
      exemption.id,
      coordinateSystem
    )

    if (validationResult.error) {
      const convertedError = convertArrayErrorsToFlattenedErrors(
        validationResult.error
      )
      return handleValidationFailure(
        request,
        h,
        convertedError,
        coordinateSystem
      )
    }

    let validatedCoordinates = validationResult.value.coordinates
    await updateExemptionSiteDetails(
      request,
      h,
      siteIndex,
      'coordinates',
      validatedCoordinates
    )
    if (payload.add) {
      const emptyCoordinate =
        coordinateSystem === COORDINATE_SYSTEMS.OSGB36
          ? { eastings: '', northings: '' }
          : { latitude: '', longitude: '' }

      validatedCoordinates = [...validatedCoordinates, emptyCoordinate]

      return renderMultipleCoordinatesView(
        h,
        validatedCoordinates,
        coordinateSystem,
        exemption?.projectName
      )
    }

    if (payload.remove) {
      return renderMultipleCoordinatesView(
        h,
        validatedCoordinates,
        coordinateSystem,
        exemption?.projectName
      )
    }

    const nextRoute = action
      ? `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
      : routes.REVIEW_SITE_DETAILS + queryParams

    await saveSiteDetailsToBackend(request, h)

    return h.redirect(nextRoute)
  }
}
