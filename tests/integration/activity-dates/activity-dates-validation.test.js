import { routes } from '~/src/server/common/constants/routes.js'
import {
  expectFieldsetError,
  expectDateInputValues,
  expectNoFieldsetError
} from '~/tests/integration/shared/expect-utils.js'
import {
  exemptionNoActivityDates,
  INVALID_DATES,
  DATE_ORDER_TESTS,
  DATE_PART_MISSING_TESTS
} from './fixtures.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { requestBody } from './helpers.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { getNextYear, getToday } from '~/tests/integration/shared/dates.js'
import { submitForm } from '~/tests/integration/shared/app-server.js'
import { mockExemptions } from '../shared/test-setup-helpers.js'

describe('Activity dates - form validation', () => {
  const getServer = setupTestServer()

  beforeEach(() => mockExemption(exemptionNoActivityDates))

  const submitActivityDatesForm = async (formData) => {
    const { document } = await submitForm({
      requestUrl: routes.ACTIVITY_DATES,
      server: getServer(),
      formData
    })
    return document
  }

  describe('Whole start or end date missing', () => {
    test('both start and end dates missing', async () => {
      const document = await submitActivityDatesForm(requestBody())
      expectFieldsetError({
        document,
        fieldsetLabel: 'Start date',
        errorMessage: 'Enter the start date'
      })
      expectFieldsetError({
        document,
        fieldsetLabel: 'End date',
        errorMessage: 'Enter the end date'
      })
    })

    test('start date missing', async () => {
      const endDate = { day: '1', month: '1', year: getNextYear() }
      const document = await submitActivityDatesForm(requestBody({ endDate }))
      expectFieldsetError({
        document,
        fieldsetLabel: 'Start date',
        errorMessage: 'Enter the start date'
      })
      expectNoFieldsetError({
        document,
        fieldsetLabel: 'End date',
        errorMessage: 'Enter the end date'
      })
      expectDateInputValues({
        document,
        fieldsetLabel: 'End date',
        ...endDate
      })
    })

    test('end date missing', async () => {
      const startDate = { day: '1', month: '1', year: getNextYear() }
      const document = await submitActivityDatesForm(requestBody({ startDate }))
      expectFieldsetError({
        document,
        fieldsetLabel: 'End date',
        errorMessage: 'Enter the end date'
      })
      expectNoFieldsetError({
        document,
        fieldsetLabel: 'Start date',
        errorMessage: 'Enter the start date'
      })
      expectDateInputValues({
        document,
        fieldsetLabel: 'Start date',
        ...startDate
      })
    })
  })

  describe('Date is missing day or month or year', () => {
    test.each(DATE_PART_MISSING_TESTS)(
      '$fieldsetLabel is missing the $missingPart',
      async ({ fieldsetLabel, errorMessage, formData }) => {
        const document = await submitActivityDatesForm(requestBody(formData))
        expectFieldsetError({
          document,
          fieldsetLabel,
          errorMessage
        })
      }
    )
  })

  describe("Dates that don't exist", () => {
    test.each(
      INVALID_DATES.map(({ reason, ...date }) => ({
        formData: {
          startDate: date,
          endDate: { day: 31, month: 12, year: getNextYear() }
        },
        reason,
        fieldsetLabel: 'Start date'
      }))
    )('Start date is: $reason', async ({ formData, fieldsetLabel }) => {
      const document = await submitActivityDatesForm(requestBody(formData))
      expectFieldsetError({
        document,
        fieldsetLabel,
        errorMessage: `The start date must be a real date`
      })
    })

    test.each(
      INVALID_DATES.map(({ reason, ...date }) => ({
        formData: {
          startDate: { day: 1, month: 1, year: getNextYear() },
          endDate: date
        },
        reason,
        fieldsetLabel: 'End date'
      }))
    )('End date is: $reason', async ({ formData, fieldsetLabel }) => {
      const document = await submitActivityDatesForm(requestBody(formData))
      expectFieldsetError({
        document,
        fieldsetLabel,
        errorMessage: `The end date must be a real date`
      })
    })
  })

  describe('Dates in the past', () => {
    test.each([
      {
        dateType: 'start',
        formData: {
          startDate: { day: '18', month: '1', year: '2024' },
          endDate: { day: '1', month: '1', year: '2028' }
        },
        fieldsetLabel: 'Start date'
      },
      {
        dateType: 'end',
        formData: {
          startDate: { day: '1', month: '12', year: '2023' },
          endDate: { day: '1', month: '1', year: '2024' }
        },
        fieldsetLabel: 'End date'
      }
    ])(
      'should show error when $dateType date is in the past',
      async ({ dateType, formData, fieldsetLabel }) => {
        const document = await submitActivityDatesForm(requestBody(formData))
        expectFieldsetError({
          document,
          fieldsetLabel,
          errorMessage: `The ${dateType} date must be today or in the future`
        })
      }
    )
  })

  describe('Order of start and end dates', () => {
    test('a start and end date of today is valid', async () => {
      const { response } = await submitForm({
        requestUrl: routes.ACTIVITY_DATES,
        server: getServer(),
        formData: requestBody({ startDate: getToday(), endDate: getToday() })
      })
      // page redirected, so no error
      expect(response.statusCode).toBe(statusCodes.redirect)
    })

    test.each(DATE_ORDER_TESTS)(
      'should show error when end date is before start date',
      async ({
        startDay,
        startMonth,
        startYear,
        endDay,
        endMonth,
        endYear
      }) => {
        const document = await submitActivityDatesForm(
          requestBody({
            startDate: { day: startDay, month: startMonth, year: startYear },
            endDate: { day: endDay, month: endMonth, year: endYear }
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'End date',
          errorMessage:
            'The end date must be the same as or after the start date'
        })
      }
    )
  })

  describe('Dates too far apart', () => {
    const getDateExactlyOneYearAfterStart = (startDate) => {
      // JavaScript Date months are 0-indexed, so subtract 1 from 1-indexed month values
      const start = new Date(
        parseInt(startDate.year),
        parseInt(startDate.month) - 1,
        parseInt(startDate.day)
      )
      const end = new Date(start)
      end.setFullYear(start.getFullYear() + 1)
      return {
        day: end.getDate().toString(),
        month: (end.getMonth() + 1).toString(),
        year: end.getFullYear().toString()
      }
    }

    const getDateMoreThanOneYearAfterStart = (startDate) => {
      const start = new Date(
        parseInt(startDate.year),
        parseInt(startDate.month) - 1,
        parseInt(startDate.day)
      )
      const end = new Date(start)
      end.setFullYear(start.getFullYear() + 1)
      end.setDate(end.getDate() + 1)
      return {
        day: end.getDate().toString(),
        month: (end.getMonth() + 1).toString(),
        year: end.getFullYear().toString()
      }
    }

    test('should show error when end date is more than 1 year after start date', async () => {
      const startDate = getToday()
      const endDate = getDateMoreThanOneYearAfterStart(startDate)
      const document = await submitActivityDatesForm(
        requestBody({ startDate, endDate })
      )
      expectFieldsetError({
        document,
        fieldsetLabel: 'End date',
        errorMessage:
          'Activity end date must be within 1 year of the start date'
      })
    })

    test('should still show error with article 20', async () => {
      const exemptionWithArticle20 = {
        ...exemptionNoActivityDates,
        mcmsContext: {
          articleCode: '20'
        }
      }
      mockExemptions(exemptionWithArticle20)

      const startDate = getToday()
      const endDate = getDateMoreThanOneYearAfterStart(startDate)
      const document = await submitActivityDatesForm(
        requestBody({ startDate, endDate })
      )
      expectFieldsetError({
        document,
        fieldsetLabel: 'End date',
        errorMessage:
          'Activity end date must be within 1 year of the start date'
      })
    })

    test('should still show error with article 34', async () => {
      const exemptionWithArticle20 = {
        ...exemptionNoActivityDates,
        mcmsContext: {
          articleCode: '34'
        }
      }
      mockExemptions(exemptionWithArticle20)

      const startDate = getToday()
      const endDate = getDateMoreThanOneYearAfterStart(startDate)
      const document = await submitActivityDatesForm(
        requestBody({ startDate, endDate })
      )
      expectFieldsetError({
        document,
        fieldsetLabel: 'End date',
        errorMessage:
          'Activity end date must be within 1 year of the start date'
      })
    })

    test('should accept dates exactly 1 year apart', async () => {
      const startDate = getToday()
      const endDate = getDateExactlyOneYearAfterStart(startDate)
      const { response } = await submitForm({
        requestUrl: routes.ACTIVITY_DATES,
        server: getServer(),
        formData: requestBody({ startDate, endDate })
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
    })

    test('should accept dates less than 1 year apart', async () => {
      const startDate = getToday()
      const start = new Date(
        parseInt(startDate.year),
        parseInt(startDate.month) - 1,
        parseInt(startDate.day)
      )
      const end = new Date(start)
      end.setMonth(start.getMonth() + 6)
      const endDateSixMonths = {
        day: end.getDate().toString(),
        month: (end.getMonth() + 1).toString(),
        year: end.getFullYear().toString()
      }
      const { response } = await submitForm({
        requestUrl: routes.ACTIVITY_DATES,
        server: getServer(),
        formData: requestBody({ startDate, endDate: endDateSixMonths })
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
    })
  })

  describe('Dates too far in the future', () => {
    const getDateMoreThan10YearsInFuture = () => {
      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setFullYear(today.getFullYear() + 11)
      return {
        day: futureDate.getDate().toString(),
        month: (futureDate.getMonth() + 1).toString(),
        year: futureDate.getFullYear().toString()
      }
    }

    const getDateExactly10YearsInFuture = () => {
      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setFullYear(today.getFullYear() + 10)
      return {
        day: futureDate.getDate().toString(),
        month: (futureDate.getMonth() + 1).toString(),
        year: futureDate.getFullYear().toString()
      }
    }

    test('should show error when start date is more than 10 years in the future', async () => {
      const startDate = getDateMoreThan10YearsInFuture()
      const endDate = getDateMoreThan10YearsInFuture()
      const document = await submitActivityDatesForm(
        requestBody({ startDate, endDate })
      )
      expectFieldsetError({
        document,
        fieldsetLabel: 'Start date',
        errorMessage: 'Activity start date must be within the next 10 years'
      })
    })

    test('should show error when end date is more than 10 years in the future', async () => {
      const startDate = getNextYear()
      const endDate = getDateMoreThan10YearsInFuture()
      const document = await submitActivityDatesForm(
        requestBody({
          startDate: { day: '1', month: '1', year: startDate },
          endDate
        })
      )
      expectFieldsetError({
        document,
        fieldsetLabel: 'End date',
        errorMessage: 'Activity end date must be within the next 10 years'
      })
    })

    test('should accept dates exactly 10 years in the future', async () => {
      const startDate = getDateExactly10YearsInFuture()
      const endDate = getDateExactly10YearsInFuture()
      const { response } = await submitForm({
        requestUrl: routes.ACTIVITY_DATES,
        server: getServer(),
        formData: requestBody({ startDate, endDate })
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
    })

    test('should accept past dates for article 20', async () => {
      const exemptionWithArticle20 = {
        ...exemptionNoActivityDates,
        mcmsContext: {
          articleCode: '20'
        }
      }
      mockExemption(exemptionWithArticle20)

      const today = getToday()
      const pastDate = new Date(
        parseInt(today.year),
        parseInt(today.month) - 1,
        parseInt(today.day)
      )
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      const startDate = {
        day: pastDate.getDate().toString(),
        month: (pastDate.getMonth() + 1).toString(),
        year: pastDate.getFullYear().toString()
      }
      const endDate = { ...startDate }

      const { response } = await submitForm({
        requestUrl: routes.ACTIVITY_DATES,
        server: getServer(),
        formData: requestBody({ startDate, endDate })
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
    })

    test('should accept past dates for article 34', async () => {
      const exemptionWithArticle34 = {
        ...exemptionNoActivityDates,
        mcmsContext: {
          articleCode: '34'
        }
      }
      mockExemptions(exemptionWithArticle34)

      const today = getToday()
      const pastDate = new Date(
        parseInt(today.year),
        parseInt(today.month) - 1,
        parseInt(today.day)
      )
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      const startDate = {
        day: pastDate.getDate().toString(),
        month: (pastDate.getMonth() + 1).toString(),
        year: pastDate.getFullYear().toString()
      }
      const endDate = { ...startDate }

      const { response } = await submitForm({
        requestUrl: routes.ACTIVITY_DATES,
        server: getServer(),
        formData: requestBody({ startDate, endDate })
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
    })

    test('should show error for past dates with other articles', async () => {
      const exemptionWithOtherArticle = {
        ...exemptionNoActivityDates,
        mcmsContext: {
          articleCode: '17'
        }
      }
      mockExemptions(exemptionWithOtherArticle)

      const today = getToday()
      const pastDate = new Date(
        parseInt(today.year),
        parseInt(today.month) - 1,
        parseInt(today.day)
      )
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      const startDate = {
        day: pastDate.getDate().toString(),
        month: (pastDate.getMonth() + 1).toString(),
        year: pastDate.getFullYear().toString()
      }
      const endDate = { ...startDate }

      const document = await submitActivityDatesForm(
        requestBody({ startDate, endDate })
      )
      expectFieldsetError({
        document,
        fieldsetLabel: 'Start date',
        errorMessage: 'The start date must be today or in the future'
      })
    })
  })

  test('maintain form values after a validation error', async () => {
    const startDate = { day: '18', month: '1', year: '2024' }
    const endDate = { day: '1', month: '1', year: '2028' }
    const document = await submitActivityDatesForm(
      requestBody({
        startDate,
        endDate
      })
    )
    expectDateInputValues({
      document,
      fieldsetLabel: 'Start date',
      ...startDate
    })
    expectDateInputValues({
      document,
      fieldsetLabel: 'End date',
      ...endDate
    })
  })
})
