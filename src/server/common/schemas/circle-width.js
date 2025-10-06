import { JOI_ERRORS } from '#src/server/common/constants/joi.js'
import joi from 'joi'

export const circleWidthValidationSchema = joi.object({
  width: joi
    .string()
    .required()
    .custom((value, helpers) => {
      const width = Number(value)

      if (isNaN(width)) {
        return helpers.error(JOI_ERRORS.NUMBER_BASE)
      }

      if (width <= 0) {
        return helpers.error(JOI_ERRORS.NUMBER_MIN)
      }

      if (!Number.isInteger(width)) {
        return helpers.error(JOI_ERRORS.NUMBER_INTEGER)
      }

      return value
    })
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'WIDTH_REQUIRED',
      [JOI_ERRORS.ANY_REQUIRED]: 'WIDTH_REQUIRED',
      [JOI_ERRORS.NUMBER_BASE]: 'WIDTH_INVALID',
      [JOI_ERRORS.NUMBER_MIN]: 'WIDTH_MIN',
      [JOI_ERRORS.NUMBER_INTEGER]: 'WIDTH_NON_INTEGER'
    })
})
