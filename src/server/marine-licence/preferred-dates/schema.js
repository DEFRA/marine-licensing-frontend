import joi from 'joi'
import {
  MONTH_PATTERN,
  YEAR_PATTERN,
  datePartSchema
} from '#src/server/common/validation/date-part/schema.js'

export const preferredDatesSchema = joi.object({
  'start-date-month': datePartSchema(
    MONTH_PATTERN,
    'PREFERRED_START_MONTH_REQUIRED',
    'PREFERRED_START_MONTH_INVALID'
  ),
  'start-date-year': datePartSchema(
    YEAR_PATTERN,
    'PREFERRED_START_YEAR_REQUIRED',
    'PREFERRED_START_YEAR_INVALID'
  ),
  'end-date-month': datePartSchema(
    MONTH_PATTERN,
    'PREFERRED_END_MONTH_REQUIRED',
    'PREFERRED_END_MONTH_INVALID'
  ),
  'end-date-year': datePartSchema(
    YEAR_PATTERN,
    'PREFERRED_END_YEAR_REQUIRED',
    'PREFERRED_END_YEAR_INVALID'
  )
})
