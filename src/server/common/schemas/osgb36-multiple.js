import joi from 'joi'
import { createEastingsSchema, createNorthingsSchema } from './osgb36.js'

/**
 * Create OSGB36 multiple coordinates validation schema
 * Uses dynamic field validation to provide point-specific error messages per specification
 * @param {object} payload - Form payload to determine number of points
 * @returns {object} Joi validation schema
 */
export const createOsgb36MultipleCoordinatesSchema = (payload) => {
  const minPoints = 3
  let pointCount = minPoints

  if (payload) {
    const fieldNames = Object.keys(payload).filter(
      (name) => name !== 'csrfToken'
    )
    const coordinateFields = fieldNames.filter((name) =>
      name.startsWith('coordinates[')
    )
    if (coordinateFields.length > 0) {
      const indices = coordinateFields
        .map((name) => {
          const match = name.match(/coordinates\[(\d+)\]/)
          return match ? parseInt(match[1], 10) : -1
        })
        .filter((index) => index >= 0)
      if (indices.length > 0) {
        pointCount = Math.max(Math.max(...indices) + 1, minPoints)
      }
    }
  }

  const schemaFields = {}

  for (let i = 0; i < pointCount; i++) {
    const pointName = i === 0 ? 'the start and end point' : `point ${i + 1}`

    schemaFields[`coordinates[${i}][eastings]`] =
      createEastingsSchema(pointName)
    schemaFields[`coordinates[${i}][northings]`] =
      createNorthingsSchema(pointName)
  }

  schemaFields.csrfToken = joi.string().optional()
  schemaFields.id = joi
    .string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'Exemption ID is required',
      'any.required': 'Exemption ID is required',
      'string.pattern.base': 'Exemption ID must be a valid ObjectId'
    })

  return joi.object(schemaFields)
}
