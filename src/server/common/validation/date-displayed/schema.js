import joi from 'joi'
import {
  DAY_PATTERN,
  MONTH_PATTERN,
  YEAR_PATTERN,
  datePartSchema
} from '#src/server/common/validation/date-part/schema.js'

const REQUIRED = 'DATE_DISPLAYED_REQUIRED'
const INVALID = 'DATE_DISPLAYED_DATE_INVALID'

export const dateDisplayedSchema = joi.object({
  'date-displayed-day': datePartSchema(DAY_PATTERN, REQUIRED, INVALID),
  'date-displayed-month': datePartSchema(MONTH_PATTERN, REQUIRED, INVALID),
  'date-displayed-year': datePartSchema(YEAR_PATTERN, REQUIRED, INVALID)
})
