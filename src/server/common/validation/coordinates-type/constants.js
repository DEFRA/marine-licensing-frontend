import joi from 'joi'

export const coordinatesTypeSettings = {
  pageTitle: 'How do you want to provide the site location?',
  heading: 'How do you want to provide the site location?'
}

export const coordinatesTypeErrorMessages = {
  PROVIDE_COORDINATES_CHOICE_REQUIRED:
    'Select how you want to provide the site location'
}

export const coordinatesTypeSchema = joi.object({
  coordinatesType: joi
    .string()
    .valid('file', 'coordinates')
    .required()
    .messages({
      'any.only': 'PROVIDE_COORDINATES_CHOICE_REQUIRED',
      'string.empty': 'PROVIDE_COORDINATES_CHOICE_REQUIRED',
      'any.required': 'PROVIDE_COORDINATES_CHOICE_REQUIRED'
    })
})
