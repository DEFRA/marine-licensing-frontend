import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-utils.js'
import { getCoordinateSystem } from '~/src/server/common/helpers/coordinate-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { getPayload } from '~/src/server/exemption/site-details/centre-coordinates/utils.js'
import { wgs84ValidationSchema } from '~/src/server/common/schemas/wgs84.js'
import { osgb36ValidationSchema } from '~/src/server/common/schemas/osgb36.js'

export const COORDINATE_SYSTEM_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]: 'exemption/site-details/centre-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]:
    'exemption/site-details/centre-coordinates/osgb36'
}

const centreCoordinatesPageData = {
  pageTitle: 'Enter the coordinates at the centre point of the site',
  heading: 'Enter the coordinates at the centre point of the site',
  backLink: routes.COORDINATE_SYSTEM_CHOICE
}

export const errorMessages = {
  [COORDINATE_SYSTEMS.WGS84]: {
    LATITUDE_REQUIRED: 'Enter the latitude',
    LATITUDE_LENGTH: 'Latitude must be between -90 and 90',
    LATITUDE_NON_NUMERIC: 'Latitude must be a number',
    LATITUDE_DECIMAL_PLACES:
      'Latitude must include 6 decimal places, like 55.019889',
    LONGITUDE_REQUIRED: 'Enter the longitude',
    LONGITUDE_LENGTH: 'Longitude must be between -180 and 180',
    LONGITUDE_NON_NUMERIC: 'Longitude must be a number',
    LONGITUDE_DECIMAL_PLACES:
      'Longitude must include 6 decimal places, like -1.399500'
  },
  [COORDINATE_SYSTEMS.OSGB36]: {
    EASTINGS_REQUIRED: 'Enter the eastings',
    EASTINGS_NON_NUMERIC: 'Eastings must be a number',
    EASTINGS_LENGTH: 'Eastings must be 6 digits',
    EASTINGS_POSITIVE_NUMBER:
      'Eastings must be a positive 6-digit number, like 123456',
    NORTHINGS_REQUIRED: 'Enter the northings',
    NORTHINGS_NON_NUMERIC: 'Northings must be a number',
    NORTHINGS_LENGTH: 'Northings must be 6 or 7 digits',
    NORTHINGS_POSITIVE_NUMBER:
      'Northings must be a positive 6 or 7-digit number, like 123456'
  }
}

/**
 * A GDS styled page controller for the centre coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const centreCoordinatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    const siteDetails = getSiteDetailsBySite(exemption)

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
      ...centreCoordinatesPageData,
      projectName: exemption.projectName,
      payload: getPayload(siteDetails, coordinateSystem)
    })
  }
}

export const centreCoordinatesSubmitFailHandler = (
  request,
  h,
  error,
  coordinateSystem
) => {
  const { payload } = request
  const exemption = getExemptionCache(request)

  const { projectName } = exemption

  if (!error.details) {
    return h
      .view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
        ...centreCoordinatesPageData,
        projectName,
        payload
      })
      .takeover()
  }
  const errorSummary = mapErrorsForDisplay(
    error.details,
    errorMessages[coordinateSystem]
  )

  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
      ...centreCoordinatesPageData,
      projectName,
      payload,
      errors,
      errorSummary
    })
    .takeover()
}

/**
 * A GDS styled page controller for the POST route in the centre coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const centreCoordinatesSubmitController = {
  handler(request, h) {
    const { payload } = request

    const { coordinateSystem } = getCoordinateSystem(request)

    const schema =
      coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? osgb36ValidationSchema
        : wgs84ValidationSchema

    const { error } = schema.validate(payload, {
      abortEarly: false
    })

    if (error) {
      return centreCoordinatesSubmitFailHandler(
        request,
        h,
        error,
        coordinateSystem
      )
    }

    updateExemptionSiteDetails(request, 0, 'coordinates', payload)

    return h.redirect(routes.WIDTH_OF_SITE)
  }
}
