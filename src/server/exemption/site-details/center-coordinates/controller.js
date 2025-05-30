import {
  getCoordinateSystem,
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { getPayload } from '~/src/server/exemption/site-details/center-coordinates/utils.js'
import {
  osgb36ValidationSchema,
  wgs64ValidationSchema
} from '~/src/server/exemption/site-details/center-coordinates/models.js'

export const COORDINATE_SYSTEM_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]: 'exemption/site-details/center-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]:
    'exemption/site-details/center-coordinates/osgb36'
}

const centerCoordinatesPageData = {
  pageTitle: 'Enter the coordinates at the centre point of the site',
  heading: 'Enter the coordinates at the centre point of the site',
  backLink: routes.COORDINATE_SYSTEM_CHOICE
}

export const errorMessages = {
  [COORDINATE_SYSTEMS.WGS84]: {
    LATITUDE_REQUIRED: 'Enter the latitude',
    LATITUDE_LENGTH: 'Latitude must be between -90 and 90',
    LONGITUDE_REQUIRED: 'Enter the longitude',
    LONGITUDE_LENGTH: 'Longitude must be between -90 and 90'
  },
  [COORDINATE_SYSTEMS.OSGB36]: {
    EASTINGS_REQUIRED: 'Enter the eastings',
    EASTINGS_LENGTH: 'Eastings must be exactly 6 digits',
    NORTHINGS_REQUIRED: 'Enter the northings',
    NORTHINGS_LENGTH: 'Northings must be 6 or 7 digits'
  }
}

/**
 * A GDS styled page controller for the center coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const centerCoordinatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    const siteDetails = exemption.siteDetails ?? {}

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
      ...centerCoordinatesPageData,
      projectName: exemption.projectName,
      payload: getPayload(siteDetails, coordinateSystem)
    })
  }
}

export const centerCoordinatesSubmitFailHandler = (
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
        ...centerCoordinatesPageData,
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
      ...centerCoordinatesPageData,
      projectName,
      payload,
      errors,
      errorSummary
    })
    .takeover()
}

/**
 * A GDS styled page controller for the POST route in the center coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const centerCoordinatesSubmitController = {
  handler(request, h) {
    const { payload } = request

    const { coordinateSystem } = getCoordinateSystem(request)

    const exemption = getExemptionCache(request)

    const { projectName } = exemption

    const schema =
      coordinateSystem === COORDINATE_SYSTEMS.OSGB36
        ? osgb36ValidationSchema
        : wgs64ValidationSchema

    const { error } = schema.validate(payload, {
      abortEarly: false
    })

    if (error) {
      return centerCoordinatesSubmitFailHandler(
        request,
        h,
        error,
        coordinateSystem
      )
    }

    updateExemptionSiteDetails(request, 'coordinates', payload)

    return h
      .view(COORDINATE_SYSTEM_VIEW_ROUTES[coordinateSystem], {
        ...centerCoordinatesPageData,
        payload,
        projectName
      })
      .takeover()
  }
}
