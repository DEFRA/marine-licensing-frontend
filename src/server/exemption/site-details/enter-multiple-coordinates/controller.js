import { routes } from '~/src/server/common/constants/routes.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails,
  getCoordinateSystem
} from '~/src/server/common/helpers/session-cache/utils.js'
import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84-multiple.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36-multiple.js'
import { config } from '~/src/config/config.js'
import Wreck from '@hapi/wreck'
import Boom from '@hapi/boom'

const MULTIPLE_COORDINATES_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]:
    'exemption/site-details/enter-multiple-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]:
    'exemption/site-details/enter-multiple-coordinates/osgb36'
}

export const multipleCoordinatesPageData = {
  heading:
    'Enter multiple sets of coordinates to mark the boundary of the site',
  backLink: routes.COORDINATE_SYSTEM_CHOICE
}

/**
 * Get the appropriate validation schema for the coordinate system
 * @param {string} coordinateSystem - Current coordinate system
 * @param {object} payload - Form payload to determine number of points
 * @returns {object} Joi validation schema
 */
const getValidationSchema = (coordinateSystem, payload) => {
  if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
    return createWgs84MultipleCoordinatesSchema(payload)
  } else {
    return createOsgb36MultipleCoordinatesSchema(payload)
  }
}

/**
 * Convert flattened payload to nested coordinates array
 * @param {object} payload - Flattened payload from form
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {Array} Array of coordinate objects
 */
const convertPayloadToCoordinatesArray = (payload, coordinateSystem) => {
  const coordinates = []
  const fieldNames = Object.keys(payload).filter((name) =>
    name.startsWith('coordinates[')
  )

  const indices = new Set()
  fieldNames.forEach((name) => {
    const match = name.match(/coordinates\[(\d+)\]/)
    if (match) {
      indices.add(parseInt(match[1], 10))
    }
  })

  Array.from(indices)
    .sort()
    .forEach((index) => {
      const coordinate = {}
      if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
        coordinate.latitude = payload[`coordinates[${index}][latitude]`] || ''
        coordinate.longitude = payload[`coordinates[${index}][longitude]`] || ''
      } else {
        coordinate.eastings = payload[`coordinates[${index}][eastings]`] || ''
        coordinate.northings = payload[`coordinates[${index}][northings]`] || ''
      }
      coordinates[index] = coordinate
    })

  return coordinates
}

/**
 * Convert form payload to structured format for template display
 * @param {object} payload - Raw form payload
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {object} Structured payload object for template
 */
const convertFormPayloadToStructured = (payload, coordinateSystem) => {
  const coordinates = []

  const fieldNames = Object.keys(payload).filter((name) =>
    name.startsWith('coordinates[')
  )

  const indices = new Set()
  fieldNames.forEach((name) => {
    const match = name.match(/coordinates\[(\d+)\]/)
    if (match) {
      indices.add(parseInt(match[1], 10))
    }
  })

  Array.from(indices)
    .sort()
    .forEach((index) => {
      const coordinate = {}
      if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
        coordinate.latitude = payload[`coordinates[${index}][latitude]`] || ''
        coordinate.longitude = payload[`coordinates[${index}][longitude]`] || ''
      } else {
        coordinate.eastings = payload[`coordinates[${index}][eastings]`] || ''
        coordinate.northings = payload[`coordinates[${index}][northings]`] || ''
      }
      coordinates[index] = coordinate
    })

  while (coordinates.length < 3) {
    if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
      coordinates.push({ latitude: '', longitude: '' })
    } else {
      coordinates.push({ eastings: '', northings: '' })
    }
  }

  return { coordinates }
}

/**
 * Get payload data from session for the current coordinate system
 * @param {object} siteDetails - Site details from session
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {object} Payload object for template
 */
const getPayload = (siteDetails, coordinateSystem) => {
  const multipleCoordinates = siteDetails.multipleCoordinates || {}

  if (multipleCoordinates.coordinates) {
    return { coordinates: multipleCoordinates.coordinates }
  }

  const coordinates = []

  let maxIndex = 0
  const fieldNames = Object.keys(multipleCoordinates)
  fieldNames.forEach((fieldName) => {
    const match = fieldName.match(/\d+$/)
    if (match) {
      const index = parseInt(match[0], 10)
      maxIndex = Math.max(maxIndex, index)
    }
  })

  const coordinateCount = Math.max(maxIndex, 3)

  if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
    for (let i = 1; i <= coordinateCount; i++) {
      const latitude = multipleCoordinates[`latitude${i}`] || ''
      const longitude = multipleCoordinates[`longitude${i}`] || ''

      coordinates[i - 1] = { latitude, longitude }
    }
  } else {
    for (let i = 1; i <= coordinateCount; i++) {
      const eastings = multipleCoordinates[`eastings${i}`] || ''
      const northings = multipleCoordinates[`northings${i}`] || ''

      coordinates[i - 1] = { eastings, northings }
    }
  }

  while (coordinates.length < 3) {
    if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
      coordinates.push({ latitude: '', longitude: '' })
    } else {
      coordinates.push({ eastings: '', northings: '' })
    }
  }

  return { coordinates }
}

/**
 * A GDS styled page controller for the multiple coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const multipleCoordinatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    const siteDetails = exemption.siteDetails ?? {}
    const payload = getPayload(siteDetails, coordinateSystem)

    const { action, pointIndex } = request.query || {}

    if (action === 'add') {
      if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
        payload.coordinates.push({ latitude: '', longitude: '' })
      } else {
        payload.coordinates.push({ eastings: '', northings: '' })
      }
    } else if (action === 'remove' && pointIndex !== undefined) {
      const index = parseInt(pointIndex, 10)
      if (index > 2 && payload.coordinates.length > 3) {
        payload.coordinates.splice(index, 1)
      }
    }

    return h.view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      projectName: exemption.projectName,
      payload
    })
  }
}

/**
 * Handle validation failure for multiple coordinates submit
 * @param {object} request - Hapi request object
 * @param {object} h - Hapi response toolkit
 * @param {object} error - Validation error
 * @param {string} coordinateSystem - Current coordinate system
 * @returns {object} Error response
 */
export const multipleCoordinatesSubmitFailHandler = (
  request,
  h,
  error,
  coordinateSystem
) => {
  const { payload } = request
  const exemption = getExemptionCache(request)

  const { projectName } = exemption

  const structuredPayload = convertFormPayloadToStructured(
    payload,
    coordinateSystem
  )

  if (!error.details) {
    return h
      .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
        ...multipleCoordinatesPageData,
        projectName,
        payload: structuredPayload
      })
      .takeover()
  }

  const errorSummary = error.details.map((detail) => {
    const fieldName = detail.path.join('').replace(/\[|\]/g, '')
    return {
      href: `#${fieldName}`,
      text: detail.message
    }
  })

  const errors = {}
  error.details.forEach((detail) => {
    const fieldName = detail.path.join('').replace(/\[|\]/g, '')
    errors[fieldName] = { text: detail.message }
  })

  return h
    .view(MULTIPLE_COORDINATES_VIEW_ROUTES[coordinateSystem], {
      ...multipleCoordinatesPageData,
      projectName,
      payload: structuredPayload,
      errors,
      errorSummary
    })
    .takeover()
}

/**
 * A GDS styled page controller for the POST route in the multiple coordinates page.
 * @satisfies {Partial<ServerRoute>}
 */
export const multipleCoordinatesSubmitController = {
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    const { coordinateSystem } = getCoordinateSystem(request)

    const payloadWithId = {
      ...payload,
      id: exemption.id
    }

    const schema = getValidationSchema(coordinateSystem, payloadWithId)

    const { error } = schema.validate(payloadWithId, {
      abortEarly: false
    })

    if (error) {
      request.payload = payloadWithId
      return multipleCoordinatesSubmitFailHandler(
        request,
        h,
        error,
        coordinateSystem
      )
    }

    const coordinates = convertPayloadToCoordinatesArray(
      payloadWithId,
      coordinateSystem
    )

    updateExemptionSiteDetails(request, 'multipleCoordinates', {
      coordinates
    })

    const updatedExemption = getExemptionCache(request)
    const cachedCoordinates =
      updatedExemption.siteDetails?.multipleCoordinates?.coordinates ||
      coordinates
    try {
      const apiUrl = `${config.get('backend').apiUrl}/exemption/multiple-coordinates`
      const payload = {
        id: exemption.id,
        coordinateSystem,
        coordinates: cachedCoordinates
      }

      request.logger.info(`Submitting to API: ${apiUrl}`, {
        payload
      })

      const { res, payload: responsePayload } = await Wreck.patch(apiUrl, {
        payload,
        json: true
      })

      request.logger.info(
        `Successfully submitted multiple coordinates for exemption ${exemption.id}`,
        { statusCode: res.statusCode, response: responsePayload }
      )

      return h.redirect(routes.TASK_LIST)
    } catch (e) {
      request.logger.error(
        `Error submitting multiple coordinates for exemption ${exemption.id}:`,
        {
          error: e.message,
          statusCode: e.output?.statusCode,
          payload: e.data?.payload,
          response: e.data?.res,
          stack: e.stack
        }
      )

      if (e.output?.statusCode >= 400 && e.output?.statusCode < 500) {
        throw Boom.badRequest(
          `API validation error: ${e.data?.payload || e.message}`,
          e
        )
      }

      throw Boom.badRequest('Error submitting multiple coordinates', e)
    }
  }
}
