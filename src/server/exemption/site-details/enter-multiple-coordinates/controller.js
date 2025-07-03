import joi from 'joi'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import {
  getCoordinateSystem,
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  createEastingsSchema,
  createNorthingsSchema
} from '~/src/server/common/schemas/osgb36.js'
import {
  createLatitudeSchema,
  createLongitudeSchema
} from '~/src/server/common/schemas/wgs84.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  multipleCoordinatesPageData
} from './utils.js'

// Template settings like other controllers
const multipleCoordinatesPageSettings = {
  pageTitle: 'Enter multiple coordinates',
  heading: 'Enter multiple sets of coordinates to mark the boundary of the site'
}

/**
 * Create validation schema for 3 coordinate points based on coordinate system
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {object} Joi validation schema
 */
const createMultipleCoordinatesSchema = (coordinateSystem) => {
  if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
    return joi.object({
      'point1-latitude': createLatitudeSchema('the start and end point'),
      'point1-longitude': createLongitudeSchema('the start and end point'),
      'point2-latitude': createLatitudeSchema('point 2'),
      'point2-longitude': createLongitudeSchema('point 2'),
      'point3-latitude': createLatitudeSchema('point 3'),
      'point3-longitude': createLongitudeSchema('point 3')
    })
  } else {
    return joi.object({
      'point1-eastings': createEastingsSchema('the start and end point'),
      'point1-northings': createNorthingsSchema('the start and end point'),
      'point2-eastings': createEastingsSchema('point 2'),
      'point2-northings': createNorthingsSchema('point 2'),
      'point3-eastings': createEastingsSchema('point 3'),
      'point3-northings': createNorthingsSchema('point 3')
    })
  }
}

/**
 * Convert coordinates array to form payload for display
 * @param {Array} coordinates - Array of coordinate objects
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {object} Form payload for template
 */
const convertCoordinatesToPayload = (coordinates = [], coordinateSystem) => {
  const payload = {}

  for (let i = 1; i <= 3; i++) {
    const coordinate = coordinates[i - 1] || {}
    if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
      payload[`point${i}-latitude`] = coordinate.latitude || ''
      payload[`point${i}-longitude`] = coordinate.longitude || ''
    } else {
      payload[`point${i}-eastings`] = coordinate.eastings || ''
      payload[`point${i}-northings`] = coordinate.northings || ''
    }
  }

  return payload
}

/**
 * Create template data for display
 * @param {object} payload - Form payload
 * @param {object} exemption - Exemption from session
 * @param {object} extras - Additional template data (errors, errorSummary, etc.)
 * @returns {object} Template data
 */
const createTemplateData = (payload, exemption, extras = {}) => {
  return {
    ...multipleCoordinatesPageSettings,
    projectName: exemption?.projectName,
    backLink: multipleCoordinatesPageData.backLink,
    payload,
    ...extras
  }
}

/**
 * A GDS styled page controller for the multiple coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const multipleCoordinatesController = {
  options: {},
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    // Get existing coordinates from session or create empty ones
    const existingCoordinates =
      exemption?.siteDetails?.multipleCoordinates?.coordinates || []
    const payload = convertCoordinatesToPayload(
      existingCoordinates,
      coordinateSystem
    )

    return h.view(
      MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem],
      createTemplateData(payload, exemption)
    )
  }
}

/**
 * A GDS styled page controller for the POST route in the multiple coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const multipleCoordinatesSubmitController = {
  options: {},
  handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    // Validate the payload manually
    const schema = createMultipleCoordinatesSchema(coordinateSystem)
    const validationResult = schema.validate(payload, { abortEarly: false })

    if (validationResult.error) {
      const errorSummary = mapErrorsForDisplay(
        validationResult.error.details,
        {}
      )
      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(
        MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem],
        createTemplateData(payload, exemption, { errors, errorSummary })
      )
    }

    // Validation passed - update session cache
    const coordinatesData = {
      coordinates: [
        {
          [coordinateSystem === COORDINATE_SYSTEMS.WGS84
            ? 'latitude'
            : 'eastings']:
            payload['point1-latitude'] || payload['point1-eastings'],
          [coordinateSystem === COORDINATE_SYSTEMS.WGS84
            ? 'longitude'
            : 'northings']:
            payload['point1-longitude'] || payload['point1-northings']
        },
        {
          [coordinateSystem === COORDINATE_SYSTEMS.WGS84
            ? 'latitude'
            : 'eastings']:
            payload['point2-latitude'] || payload['point2-eastings'],
          [coordinateSystem === COORDINATE_SYSTEMS.WGS84
            ? 'longitude'
            : 'northings']:
            payload['point2-longitude'] || payload['point2-northings']
        },
        {
          [coordinateSystem === COORDINATE_SYSTEMS.WGS84
            ? 'latitude'
            : 'eastings']:
            payload['point3-latitude'] || payload['point3-eastings'],
          [coordinateSystem === COORDINATE_SYSTEMS.WGS84
            ? 'longitude'
            : 'northings']:
            payload['point3-longitude'] || payload['point3-northings']
        }
      ]
    }

    updateExemptionSiteDetails(request, 'multipleCoordinates', coordinatesData)

    // Stay on same page as per AC4 - render success template with preserved form values
    return h.view(
      MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem],
      createTemplateData(payload, exemption)
    )
  }
}
