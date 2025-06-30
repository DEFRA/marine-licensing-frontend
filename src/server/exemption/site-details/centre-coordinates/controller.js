import {
  getCoordinateSystem,
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { COORDINATE_ERROR_MESSAGES } from '~/src/server/common/helpers/site-details.js'
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

// Use centralized error messages from helper
export const errorMessages = COORDINATE_ERROR_MESSAGES

/**
 * A GDS styled page controller for the centre coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const centreCoordinatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    const siteDetails = exemption.siteDetails ?? {}

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

    updateExemptionSiteDetails(request, 'coordinates', payload)

    return h.redirect(routes.WIDTH_OF_SITE)
  }
}
