import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import utc from 'dayjs/plugin/utc.js'
import { londonToday } from './london-today.js'

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const pad = (value) => String(value).padStart(2, '0')

const toDate = ({ day, month, year }) =>
  dayjs.utc(`${year}-${pad(month)}-${pad(day)}`, 'YYYY-MM-DD', true)

export const isRealDate = (date) => toDate(date).isValid()

export const isAfterToday = (date, now = londonToday()) =>
  toDate(date).isAfter(now)
