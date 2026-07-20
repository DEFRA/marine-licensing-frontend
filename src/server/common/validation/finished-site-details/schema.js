import joi from 'joi'

export const finishedSiteDetailsSchema = joi
  .object({
    finishedEnteringSiteDetails: joi
      .string()
      .valid('yes', 'no')
      .required()
      .messages({
        'any.only': 'FINISHED_SITE_DETAILS_REQUIRED',
        'string.empty': 'FINISHED_SITE_DETAILS_REQUIRED',
        'any.required': 'FINISHED_SITE_DETAILS_REQUIRED'
      })
  })
  .unknown(true)
