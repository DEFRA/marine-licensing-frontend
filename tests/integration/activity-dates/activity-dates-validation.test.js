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
