import { getByRole, getByText, within } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Activity Dates Validation - Comprehensive Integration Tests', () => {
  let server
  let getExemptionCacheMock

  const mockExemption = {
    id: 'test-exemption-123',
    projectName: 'Test Marine Activity Project',
    activityDates: null
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    getExemptionCacheMock = jest
      .mocked(getExemptionCache)
      .mockReturnValue(mockExemption)

    jest.mocked(setExemptionCache).mockImplementation(() => undefined)

    jest
      .mocked(authenticatedPatchRequest)
      .mockResolvedValue({ payload: { id: mockExemption.id } })
  })

  const INVALID_DATES = [
    { day: '31', month: '2', year: '2027', reason: 'February 31st' },
    { day: '32', month: '1', year: '2027', reason: 'Day 32' },
    { day: '15', month: '13', year: '2027', reason: 'Month 13' },
    { day: '31', month: '4', year: '2027', reason: 'April 31st' },
    { day: '31', month: '6', year: '2027', reason: 'June 31st' },
    { day: '31', month: '9', year: '2027', reason: 'September 31st' },
    { day: '31', month: '11', year: '2027', reason: 'November 31st' },
    {
      day: '29',
      month: '2',
      year: '2027',
      reason: 'February 29th non-leap year'
    }
  ]

  const DATE_ORDER_TESTS = [
    {
      startDay: '15',
      startMonth: '6',
      startYear: '2025',
      endDay: '14',
      endMonth: '6',
      endYear: '2025'
    },
    {
      startDay: '20',
      startMonth: '8',
      startYear: '2025',
      endDay: '19',
      endMonth: '8',
      endYear: '2025'
    },
    {
      startDay: '1',
      startMonth: '12',
      startYear: '2025',
      endDay: '30',
      endMonth: '11',
      endYear: '2025'
    },
    {
      startDay: '15',
      startMonth: '6',
      startYear: '2026',
      endDay: '15',
      endMonth: '6',
      endYear: '2025'
    }
  ]

  const MISSING_FIELD_TESTS = [
    {
      field: 'start',
      missingPart: 'all',
      startDate: {},
      endDate: { day: '1', month: '1', year: '2028' },
      message: 'Enter the start date'
    },
    {
      field: 'end',
      missingPart: 'all',
      startDate: { day: '15', month: '6', year: '2027' },
      endDate: {},
      message: 'Enter the end date'
    },
    {
      field: 'both',
      missingPart: 'all',
      startDate: {},
      endDate: {},
      message: 'Enter the start date'
    }
  ]

  const FIELD_VALIDATION_TESTS = [
    {
      dateType: 'start',
      field: 'day',
      payload: { month: '6', year: '2027' },
      message: 'The start date must include a day'
    },
    {
      dateType: 'start',
      field: 'month',
      payload: { day: '15', year: '2027' },
      message: 'The start date must include a month'
    },
    {
      dateType: 'start',
      field: 'year',
      payload: { day: '15', month: '6' },
      message: 'The start date must include a year'
    },
    {
      dateType: 'end',
      field: 'day',
      payload: { month: '8', year: '2028' },
      message: 'The end date must include a day'
    },
    {
      dateType: 'end',
      field: 'month',
      payload: { day: '20', year: '2028' },
      message: 'The end date must include a month'
    },
    {
      dateType: 'end',
      field: 'year',
      payload: { day: '20', month: '8' },
      message: 'The end date must include a year'
    }
  ]

  function createPayload(startDate, endDate) {
    return {
      'activity-start-date-day': startDate.day || '',
      'activity-start-date-month': startDate.month || '',
      'activity-start-date-year': startDate.year || '',
      'activity-end-date-day': endDate.day || '',
      'activity-end-date-month': endDate.month || '',
      'activity-end-date-year': endDate.year || ''
    }
  }

  async function submitFormAndVerifyErrors(payload, expectedErrors) {
    const response = await server.inject({
      method: 'POST',
      url: routes.ACTIVITY_DATES,
      payload
    })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window

    const errorSummary = getByRole(document, 'alert')
    expect(errorSummary).toBeInTheDocument()
    expect(getByText(errorSummary, 'There is a problem')).toBeInTheDocument()

    expectedErrors.forEach(({ field, message, summaryMessage }) => {
      const summaryList = within(errorSummary).getByRole('list')
      const summaryLink = within(summaryList).getByText(
        summaryMessage || message
      )
      expect(summaryLink).toBeInTheDocument()
      expect(summaryLink).toHaveAttribute(
        'href',
        expect.stringMatching(new RegExp(`^#${field}`))
      )

      const fieldContainer = document.getElementById(field)
      expect(fieldContainer).toBeInTheDocument()

      const errorMessage = getByText(
        fieldContainer.closest('.govuk-form-group') ?? fieldContainer,
        message,
        { exact: false }
      )
      expect(errorMessage).toBeInTheDocument()

      const formGroup = fieldContainer.closest('.govuk-form-group')
      const hasErrorStyling =
        formGroup?.classList.contains('govuk-form-group--error') ??
        fieldContainer.querySelectorAll('.govuk-input--error').length > 0
      expect(hasErrorStyling).toBe(true)
    })

    return { response, document }
  }

  describe('Missing Date Fields', () => {
    test.each(MISSING_FIELD_TESTS)(
      'should show error when $field date fields are missing',
      async ({ field, startDate, endDate, message }) => {
        expect.hasAssertions()

        const expectedErrors =
          field === 'both'
            ? [
                {
                  field: 'activity-start-date',
                  message: 'Enter the start date'
                },
                { field: 'activity-end-date', message: 'Enter the end date' }
              ]
            : [{ field: `activity-${field}-date`, message }]

        await submitFormAndVerifyErrors(
          createPayload(startDate, endDate),
          expectedErrors
        )
      }
    )
  })

  describe('Field Validation', () => {
    test.each(FIELD_VALIDATION_TESTS)(
      'should show error when $dateType $field is missing',
      async ({ dateType, payload, message }) => {
        expect.hasAssertions()

        const startDate =
          dateType === 'start'
            ? payload
            : { day: '1', month: '1', year: '2027' }
        const endDate =
          dateType === 'end' ? payload : { day: '1', month: '1', year: '2028' }

        await submitFormAndVerifyErrors(createPayload(startDate, endDate), [
          { field: `activity-${dateType}-date`, message }
        ])
      }
    )

    test.each([
      ...INVALID_DATES.map((date) => ({ ...date, dateType: 'start' })),
      ...INVALID_DATES.map((date) => ({ ...date, dateType: 'end' }))
    ])(
      'should show error for invalid $dateType date: $reason',
      async ({ day, month, year, dateType }) => {
        expect.hasAssertions()

        const startDate =
          dateType === 'start'
            ? { day, month, year }
            : { day: '1', month: '1', year: '2027' }
        const endDate =
          dateType === 'end'
            ? { day, month, year }
            : { day: '1', month: '1', year: '2028' }

        await submitFormAndVerifyErrors(createPayload(startDate, endDate), [
          {
            field: `activity-${dateType}-date`,
            message: `The ${dateType} date must be a real date`
          }
        ])
      }
    )

    test.each([
      {
        dateType: 'start',
        startDate: { day: '18', month: '1', year: '2024' },
        endDate: { day: '1', month: '1', year: '2028' }
      },
      {
        dateType: 'end',
        startDate: { day: '1', month: '12', year: '2023' },
        endDate: { day: '1', month: '1', year: '2024' }
      }
    ])(
      'should show error when $dateType date is in the past',
      async ({ dateType, startDate, endDate }) => {
        expect.hasAssertions()

        await submitFormAndVerifyErrors(createPayload(startDate, endDate), [
          {
            field: `activity-${dateType}-date`,
            message: `The ${dateType} date must be today or in the future`
          }
        ])
      }
    )
  })

  describe('Date Order Validation', () => {
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
        expect.hasAssertions()

        await submitFormAndVerifyErrors(
          createPayload(
            { day: startDay, month: startMonth, year: startYear },
            { day: endDay, month: endMonth, year: endYear }
          ),
          [
            {
              field: 'activity-end-date',
              message:
                'The end date must be the same as or after the start date'
            }
          ]
        )
      }
    )
  })

  describe('Form Structure and Accessibility', () => {
    test('should render form with correct structure when no errors', async () => {
      const response = await server.inject({
        method: 'GET',
        url: routes.ACTIVITY_DATES
      })

      expect(response.statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(response.result).window

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Activity dates'
      )
      expect(getByText(document, mockExemption.projectName)).toBeInTheDocument()

      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
      expect(form).toHaveAttribute('method', 'POST')

      const startDateFieldset = document.getElementById('activity-start-date')
      const endDateFieldset = document.getElementById('activity-end-date')

      expect(startDateFieldset).toBeInTheDocument()
      expect(endDateFieldset).toBeInTheDocument()

      expect(
        document.getElementById('activity-start-date-day')
      ).toBeInTheDocument()
      expect(
        document.getElementById('activity-start-date-month')
      ).toBeInTheDocument()
      expect(
        document.getElementById('activity-start-date-year')
      ).toBeInTheDocument()
      expect(
        document.getElementById('activity-end-date-day')
      ).toBeInTheDocument()
      expect(
        document.getElementById('activity-end-date-month')
      ).toBeInTheDocument()
      expect(
        document.getElementById('activity-end-date-year')
      ).toBeInTheDocument()

      const submitButton = getByRole(document, 'button', {
        name: 'Save and continue'
      })
      expect(submitButton).toHaveTextContent('Save and continue')

      expect(
        getByText(document, 'Enter the activity dates for this site', {
          exact: false
        })
      ).toBeInTheDocument()
    })

    test('should display correct text when same activity dates for all sites', async () => {
      const mockExemptionWithSameActivityDates = {
        ...mockExemption,
        siteDetails: {},
        multipleSiteDetails: {
          multipleSitesEnabled: true,
          sameActivityDates: 'yes'
        }
      }

      getExemptionCacheMock.mockReturnValue(mockExemptionWithSameActivityDates)

      const response = await server.inject({
        method: 'GET',
        url: routes.SITE_DETAILS_ACTIVITY_DATES
      })

      expect(response.statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(response.result).window

      expect(
        getByText(document, 'Enter the activity dates for all sites', {
          exact: false
        })
      ).toBeInTheDocument()
    })

    test('should display correct text when variable activity dates for sites.', async () => {
      const mockExemptionWithSameActivityDates = {
        ...mockExemption,
        siteDetails: {},
        multipleSiteDetails: {
          multipleSitesEnabled: true,
          sameActivityDates: 'no'
        }
      }

      getExemptionCacheMock.mockReturnValue(mockExemptionWithSameActivityDates)

      const response = await server.inject({
        method: 'GET',
        url: routes.SITE_DETAILS_ACTIVITY_DATES
      })

      expect(response.statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(response.result).window

      expect(
        getByText(document, 'Enter the activity dates for this site.', {
          exact: false
        })
      ).toBeInTheDocument()
    })

    test('should maintain form values after validation error', async () => {
      const payload = {
        'activity-start-date-day': '31',
        'activity-start-date-month': '2',
        'activity-start-date-year': '2027',
        'activity-end-date-day': '1',
        'activity-end-date-month': '1',
        'activity-end-date-year': '2028'
      }

      const response = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      const { document } = new JSDOM(response.result).window

      expect(document.getElementById('activity-start-date-day')).toHaveValue(
        '31'
      )
      expect(document.getElementById('activity-start-date-month')).toHaveValue(
        '2'
      )
      expect(document.getElementById('activity-start-date-year')).toHaveValue(
        '2027'
      )
      expect(document.getElementById('activity-end-date-day')).toHaveValue('1')
      expect(document.getElementById('activity-end-date-month')).toHaveValue(
        '1'
      )
      expect(document.getElementById('activity-end-date-year')).toHaveValue(
        '2028'
      )
    })
  })
})
