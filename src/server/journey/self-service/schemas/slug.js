import Joi from 'joi'

export const slugSchema = Joi.string()
  .pattern(/^[A-Za-z0-9_-]{22}$/)
  .required()
