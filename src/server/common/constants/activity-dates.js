import { JOI_ERRORS } from './joi.js'
import { routes } from './routes.js'

export const ACTIVITY_DATE_PREFIXES = {
  START: 'activity-start-date',
  END: 'activity-end-date'
}

export const ACTIVITY_DATE_FIELD_NAMES = {
  START_DATE_DAY: 'activity-start-date-day',
  START_DATE_MONTH: 'activity-start-date-month',
  START_DATE_YEAR: 'activity-start-date-year',
  END_DATE_DAY: 'activity-end-date-day',
  END_DATE_MONTH: 'activity-end-date-month',
  END_DATE_YEAR: 'activity-end-date-year'
}

export const DATE_EXTRACTION_CONFIG = [
  { key: 'activityStartDate', prefix: ACTIVITY_DATE_PREFIXES.START },
  { key: 'activityEndDate', prefix: ACTIVITY_DATE_PREFIXES.END }
]

export const ACTIVITY_DATES_VIEW_ROUTE = 'exemption/activity-dates/index'

export const ACTIVITY_DATES_VIEW_SETTINGS = {
  pageTitle: 'Activity dates',
  title: 'Activity dates',
  backLink: routes.TASK_LIST,
  cancelLink: routes.TASK_LIST
}

export const ACTIVITY_DATES_ERROR_MESSAGES = {
  [JOI_ERRORS.ACTIVITY_START_DATE_DAY]: 'The start date must include a day',
  [JOI_ERRORS.ACTIVITY_START_DATE_MONTH]: 'The start date must include a month',
  [JOI_ERRORS.ACTIVITY_START_DATE_YEAR]: 'The start date must include a year',
  [JOI_ERRORS.ACTIVITY_END_DATE_DAY]: 'The end date must include a day',
  [JOI_ERRORS.ACTIVITY_END_DATE_MONTH]: 'The end date must include a month',
  [JOI_ERRORS.ACTIVITY_END_DATE_YEAR]: 'The end date must include a year',
  [JOI_ERRORS.CUSTOM_START_DATE_MISSING]: 'Enter the start date',
  [JOI_ERRORS.CUSTOM_END_DATE_MISSING]: 'Enter the end date',
  [JOI_ERRORS.CUSTOM_START_DATE_INVALID]: 'The start date must be a real date',
  [JOI_ERRORS.CUSTOM_END_DATE_INVALID]: 'The end date must be a real date',
  [JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]:
    'The start date must be today or in the future',
  [JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]:
    'The end date must be today or in the future',
  [JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]:
    'The end date must be the same as or after the start date',
  [JOI_ERRORS.CUSTOM_START_DATE_TOO_FAR_FUTURE]:
    'Activity start date must be within the next 10 years',
  [JOI_ERRORS.CUSTOM_END_DATE_TOO_FAR_FUTURE]:
    'Activity end date must be within the next 10 years',
  [JOI_ERRORS.CUSTOM_END_DATE_TOO_FAR_APART]:
    'Activity end date must be within 1 year of the start date'
}

function createDateConfig(prefix, errorMessageKey, errorKeys) {
  const fieldNames = {
    DAY: `${prefix}-day`,
    MONTH: `${prefix}-month`,
    YEAR: `${prefix}-year`
  }

  const fieldErrorKeys = {
    [fieldNames.DAY]: errorKeys.DAY,
    [fieldNames.MONTH]: errorKeys.MONTH,
    [fieldNames.YEAR]: errorKeys.YEAR
  }

  return {
    prefix,
    fieldNames,
    errorMessageKey,
    errorKeys,
    fieldErrorKeys,
    errorMessages: ACTIVITY_DATES_ERROR_MESSAGES
  }
}

export const ACTIVITY_DATES_CONFIG = [
  createDateConfig(ACTIVITY_DATE_PREFIXES.START, 'startDateErrorMessage', {
    MISSING: JOI_ERRORS.CUSTOM_START_DATE_MISSING,
    INVALID: JOI_ERRORS.CUSTOM_START_DATE_INVALID,
    TODAY_OR_FUTURE: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE,
    TOO_FAR_FUTURE: JOI_ERRORS.CUSTOM_START_DATE_TOO_FAR_FUTURE,
    DAY: JOI_ERRORS.ACTIVITY_START_DATE_DAY,
    MONTH: JOI_ERRORS.ACTIVITY_START_DATE_MONTH,
    YEAR: JOI_ERRORS.ACTIVITY_START_DATE_YEAR
  }),
  createDateConfig(ACTIVITY_DATE_PREFIXES.END, 'endDateErrorMessage', {
    MISSING: JOI_ERRORS.CUSTOM_END_DATE_MISSING,
    INVALID: JOI_ERRORS.CUSTOM_END_DATE_INVALID,
    TODAY_OR_FUTURE: JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE,
    BEFORE_OTHER_DATE: JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE,
    TOO_FAR_FUTURE: JOI_ERRORS.CUSTOM_END_DATE_TOO_FAR_FUTURE,
    TOO_FAR_APART: JOI_ERRORS.CUSTOM_END_DATE_TOO_FAR_APART,
    DAY: JOI_ERRORS.ACTIVITY_END_DATE_DAY,
    MONTH: JOI_ERRORS.ACTIVITY_END_DATE_MONTH,
    YEAR: JOI_ERRORS.ACTIVITY_END_DATE_YEAR
  })
]
