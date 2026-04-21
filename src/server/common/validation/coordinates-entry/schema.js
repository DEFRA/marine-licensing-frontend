import joi from 'joi'

export const coordinatesEntrySchema = joi.object({
  coordinatesEntry: joi
    .string()
    .valid('single', 'multiple')
    .required()
    .messages({
      'any.only': 'COORDINATES_ENTRY_REQUIRED',
      'string.empty': 'COORDINATES_ENTRY_REQUIRED',
      'any.required': 'COORDINATES_ENTRY_REQUIRED'
    })
})
