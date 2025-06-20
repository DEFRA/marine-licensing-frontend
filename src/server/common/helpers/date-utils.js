/**
 * Day.js-based date utility functions for handling date operations across the application
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

// Date format constants
const DATE_FORMAT_ISO = 'YYYY-MM-DD'
const DATE_FORMAT_FLEXIBLE = 'YYYY-M-D'

/**
 * Creates a date from individual components and returns ISO string
 * @param {string|number} year
 * @param {string|number} month
 * @param {string|number} day
 * @returns {string|null}
 */
export function createDateISO(year, month, day) {
  // Handle undefined or null values
  if (year == null || month == null || day == null) {
    return null
  }

  const date = dayjs.utc(
    `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    DATE_FORMAT_ISO,
    true // strict parsing
  )

  return date.isValid() ? date.toISOString() : null
}

/**
 * Extracts date components from ISO date string
 * @param {string} isoDate - ISO date string
 * @returns {object} Date components
 */
export function extractDateComponents(isoDate) {
  if (!isoDate) {
    return { day: '', month: '', year: '' }
  }

  const date = dayjs.utc(isoDate)
  return {
    day: date.date().toString(),
    month: (date.month() + 1).toString(), // dayjs months are 0-indexed
    year: date.year().toString()
  }
}

/**
 * Formats a date object to a human-readable string
 * @param {Date|string} date - Date object or ISO string
 * @param {string} format - Day.js format string (default: 'D MMMM YYYY')
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'D MMMM YYYY') {
  return dayjs.utc(date).format(format)
}

/**
 * Validates if date components form a valid date
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {boolean}
 */
export function isValidDateComponents(year, month, day) {
  const date = dayjs.utc(`${year}-${month}-${day}`, DATE_FORMAT_FLEXIBLE, true)
  return date.isValid()
}

/**
 * Checks if a date is today or in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isTodayOrFuture(date) {
  const inputDate = dayjs.utc(date)
  const today = dayjs.utc().startOf('day')

  return inputDate.isSameOrAfter(today, 'day')
}

/**
 * Compares two dates and returns -1, 0, or 1
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1, date2) {
  const d1 = dayjs.utc(date1)
  const d2 = dayjs.utc(date2)

  if (d1.isBefore(d2)) {
    return -1
  }
  if (d1.isAfter(d2)) {
    return 1
  }
  return 0
}

/**
 * Checks if end date is before start date
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {boolean}
 */
export function isEndDateBeforeStartDate(startDate, endDate) {
  const start = dayjs.utc(startDate)
  const end = dayjs.utc(endDate)

  return end.isBefore(start, 'day')
}

/**
 * Creates a Day.js date from components with validation
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {dayjs.Dayjs|null} Day.js object or null if invalid
 */
export function createDayjsDate(year, month, day) {
  const date = dayjs.utc(`${year}-${month}-${day}`, DATE_FORMAT_FLEXIBLE, true)
  return date.isValid() ? date : null
}
