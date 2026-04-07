import joi from 'joi'

const SITE_NAME_MAX_LENGTH = 250

export const siteNameSchema = joi.object({
  siteName: joi.string().min(1).max(SITE_NAME_MAX_LENGTH).required().messages({
    'string.empty': 'SITE_NAME_REQUIRED',
    'any.required': 'SITE_NAME_REQUIRED',
    'string.max': 'SITE_NAME_MAX_LENGTH'
  })
})
