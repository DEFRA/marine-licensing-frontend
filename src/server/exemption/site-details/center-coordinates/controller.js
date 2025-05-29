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

import joi from 'joi'

export const COORDINATE_SYSTEM_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]: 'exemption/site-details/center-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]:
    'exemption/site-details/center-coordinates/osgb36'
}

const centerCoordinatesSettings = {
  pageTitle: 'Enter the coordinates at the centre point of the site',
  heading: 'Enter the coordinates at the centre point of the site',
  backLink: routes.COORDINATE_SYSTEM_CHOICE
}

export const errorMessages = {
  [COORDINATE_SYSTEMS.WGS84]: {
    LATITUDE_REQUIRED: 'Enter the latitude',
    LONGITUDE_REQUIRED: 'Enter the longitude'
  },
  [COORDINATE_SYSTEMS.OSGB36]: {
    EASTINGS_REQUIRED: 'Enter the eastings',
    NORTHINGS_REQUIRED: 'Enter the northings'
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
      ...centerCoordinatesSettings,
      projectName: exemption.projectName,
      payload: getPayload(siteDetails, coordinateSystem)
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the center coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const centerCoordinatesSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        latitude: joi.string().required().messages({
          'string.empty': 'LATITUDE_REQUIRED',
          'any.required': 'LATITUDE_REQUIRED'
        }),
        longitude: joi.string().required().messages({
          'string.empty': 'LONGITUDE_REQUIRED',
          'any.required': 'LONGITUDE_REQUIRED'
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        const { projectName } = getExemptionCache(request)

        if (!err.details) {
          return h
            .view(COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84], {
              ...centerCoordinatesSettings,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(
          err.details,
          errorMessages[COORDINATE_SYSTEMS.WGS84]
        )

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84], {
            ...centerCoordinatesSettings,
            payload,
            projectName,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload } = request

    const exemption = getExemptionCache(request)

    const { latitude, longitude } = payload

    updateExemptionSiteDetails(request, 'coordinates', { latitude, longitude })

    return h
      .view(COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84], {
        ...centerCoordinatesSettings,
        payload,
        projectName: exemption.projectName
      })
      .takeover()
  }
}
