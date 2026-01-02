import { getNextYear, getThisYear } from '#tests/integration/shared/dates.js'

const nextYear = getNextYear()

export const exemptionNoActivityDates = {
  id: 'test-exemption-123',
  projectName: 'Test Marine Activity Project',
  activityDates: null
}

export const INVALID_DATES = [
  { day: '31', month: '2', year: nextYear, reason: 'February 31st' },
  { day: '32', month: '1', year: nextYear, reason: 'Day 32' },
  { day: '15', month: '13', year: nextYear, reason: 'Month 13' },
  { day: '31', month: '4', year: nextYear, reason: 'April 31st' },
  { day: '31', month: '6', year: nextYear, reason: 'June 31st' },
  { day: '31', month: '9', year: nextYear, reason: 'September 31st' },
  { day: '31', month: '11', year: nextYear, reason: 'November 31st' },
  {
    day: '29',
    month: '2',
    year: nextYear,
    reason: 'February 29th non-leap year'
  }
]

export const DATE_ORDER_TESTS = [
  {
    startDay: '15',
    startMonth: '6',
    startYear: getThisYear(),
    endDay: '14',
    endMonth: '6',
    endYear: getThisYear()
  },
  {
    startDay: '20',
    startMonth: '8',
    startYear: getThisYear(),
    endDay: '19',
    endMonth: '8',
    endYear: getThisYear()
  },
  {
    startDay: '1',
    startMonth: '12',
    startYear: getThisYear(),
    endDay: '30',
    endMonth: '11',
    endYear: getThisYear()
  },
  {
    startDay: '15',
    startMonth: '6',
    startYear: getNextYear(),
    endDay: '15',
    endMonth: '6',
    endYear: getThisYear()
  }
]

export const DATE_PART_MISSING_TESTS = [
  {
    fieldsetLabel: 'Start date',
    formData: { startDate: { month: '6', year: nextYear } },
    missingPart: 'day',
    errorMessage: 'The start date must include a day'
  },
  {
    fieldsetLabel: 'Start date',
    formData: { startDate: { day: '15', year: nextYear } },
    missingPart: 'month',
    errorMessage: 'The start date must include a month'
  },
  {
    fieldsetLabel: 'Start date',
    formData: { startDate: { day: '15', month: '6' } },
    missingPart: 'year',
    errorMessage: 'The start date must include a year'
  },
  {
    fieldsetLabel: 'End date',
    formData: { endDate: { month: '6', year: nextYear } },
    missingPart: 'day',
    errorMessage: 'The end date must include a day'
  },
  {
    fieldsetLabel: 'End date',
    formData: { endDate: { day: '15', year: nextYear } },
    missingPart: 'month',
    errorMessage: 'The end date must include a month'
  },
  {
    fieldsetLabel: 'End date',
    formData: { endDate: { day: '15', month: '6' } },
    missingPart: 'year',
    errorMessage: 'The end date must include a year'
  }
]
