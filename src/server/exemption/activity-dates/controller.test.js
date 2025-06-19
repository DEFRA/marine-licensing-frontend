import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { config } from '~/src/config/config.js'
import Wreck from '@hapi/wreck'
import { JSDOM } from 'jsdom'
import {
  activityDatesController,
  activityDatesSubmitController,
  ACTIVITY_DATES_VIEW_ROUTE
} from '~/src/server/exemption/activity-dates/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#activityDatesController', () => {
  let server
  let getExemptionCacheSpy

  const mockExemptionState = {
    id: 'test-exemption-id',
    projectName: 'Test Project'
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)

    jest
      .spyOn(Wreck, 'patch')
      .mockResolvedValue({ payload: { id: mockExemption.id } })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('activityDatesController GET', () => {
    test('should render the activity dates page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.ACTIVITY_DATES
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Activity dates')

      const { document } = new JSDOM(result).window
      expect(document.querySelector('h1').textContent.trim()).toBe(
        'Activity dates'
      )
      expect(document.querySelector('form').method).toBe('post')
      expect(
        document.querySelector('button[type="submit"]').textContent.trim()
      ).toBe('Save and continue')
    })

    test('should render with empty date fields when no existing data', () => {
      const h = { view: jest.fn() }
      const request = {}

      activityDatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(ACTIVITY_DATES_VIEW_ROUTE, {
        title: 'Activity dates',
        descriptionParagraphs: [
          "Enter the activity dates. Allow time for potential delays, like consents (for example, a river works licence) or bad weather. If you miss the dates, you'll need to restart the process.",
          "You can enter a start date from today and begin your activity as soon as you've sent your information."
        ],
        backLink: routes.TASK_LIST,
        projectName: mockExemptionState.projectName,
        activityStartDateDay: '',
        activityStartDateMonth: '',
        activityStartDateYear: '',
        activityEndDateDay: '',
        activityEndDateMonth: '',
        activityEndDateYear: ''
      })
    })

    test('should pre-populate form with existing activity dates', () => {
      const exemptionWithDates = {
        ...mockExemptionState,
        activityDates: {
          start: '2025-06-15T00:00:00.000Z',
          end: '2025-06-30T00:00:00.000Z'
        }
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithDates)

      const h = { view: jest.fn() }
      const request = {}

      activityDatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(ACTIVITY_DATES_VIEW_ROUTE, {
        title: 'Activity dates',
        descriptionParagraphs: [
          "Enter the activity dates. Allow time for potential delays, like consents (for example, a river works licence) or bad weather. If you miss the dates, you'll need to restart the process.",
          "You can enter a start date from today and begin your activity as soon as you've sent your information."
        ],
        backLink: routes.TASK_LIST,
        projectName: exemptionWithDates.projectName,
        activityStartDateDay: '15',
        activityStartDateMonth: '6',
        activityStartDateYear: '2025',
        activityEndDateDay: '30',
        activityEndDateMonth: '6',
        activityEndDateYear: '2025'
      })
    })
  })

  describe('activityDatesController POST', () => {
    test('should handle form submission with valid data', async () => {
      const currentYear = new Date().getFullYear()
      const payload = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '15',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(Wreck.patch).toHaveBeenCalledWith(
        `${config.get('backend').apiUrl}/exemption/activity-dates`,
        expect.objectContaining({
          payload: expect.objectContaining({
            id: mockExemptionState.id,
            start: expect.any(String),
            end: expect.any(String)
          }),
          json: true
        })
      )
      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.TASK_LIST)
    })

    test('should handle validation errors for missing start date', async () => {
      const payload = {
        'activity-start-date-day': '',
        'activity-start-date-month': '',
        'activity-start-date-year': '',
        'activity-end-date-day': '15',
        'activity-end-date-month': '6',
        'activity-end-date-year': '2025'
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
      expect(result).toContain('Enter the start date')
    })

    test('should handle validation errors for end date before start date', async () => {
      const currentYear = new Date().getFullYear()
      const payload = {
        'activity-start-date-day': '15',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '14',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
      expect(result).toContain(
        'The end date must be the same as or after the start date'
      )

      const endDateError = document.querySelector('#activity-end-date-error')
      expect(endDateError).toBeTruthy()
      expect(endDateError.textContent.trim()).toContain(
        'The end date must be the same as or after the start date'
      )
    })

    test('should handle end date before start date - specific scenario 1 (15/06/2025 vs 14/06/2025)', async () => {
      const payload = {
        'activity-start-date-day': '15',
        'activity-start-date-month': '6',
        'activity-start-date-year': '2025',
        'activity-end-date-day': '14',
        'activity-end-date-month': '6',
        'activity-end-date-year': '2025'
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).toBeTruthy()

      expect(result).toContain(
        'The end date must be the same as or after the start date'
      )

      const endDateError = document.querySelector('#activity-end-date-error')
      expect(endDateError).toBeTruthy()
      expect(endDateError.textContent.trim()).toContain(
        'The end date must be the same as or after the start date'
      )
    })

    test('should handle end date before start date - specific scenario 2 (15/06/2026 vs 15/06/2025)', async () => {
      const payload = {
        'activity-start-date-day': '15',
        'activity-start-date-month': '6',
        'activity-start-date-year': '2026',
        'activity-end-date-day': '15',
        'activity-end-date-month': '6',
        'activity-end-date-year': '2025'
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).toBeTruthy()

      expect(result).toContain(
        'The end date must be the same as or after the start date'
      )

      const endDateError = document.querySelector('#activity-end-date-error')
      expect(endDateError).toBeTruthy()
      expect(endDateError.textContent.trim()).toContain(
        'The end date must be the same as or after the start date'
      )
    })

    test('should handle past end date - specific scenario 3 (01/12/2023 vs 01/01/2024)', async () => {
      const payload = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '12',
        'activity-start-date-year': '2023',
        'activity-end-date-day': '1',
        'activity-end-date-month': '1',
        'activity-end-date-year': '2024'
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).toBeTruthy()

      // For past dates, JOI returns on first error (start date), so we expect start date error
      expect(result).toContain('The start date must be today or in the future')

      const startDateError = document.querySelector(
        '#activity-start-date-error'
      )
      expect(startDateError).toBeTruthy()
      expect(startDateError.textContent.trim()).toContain(
        'The start date must be today or in the future'
      )

      // Since JOI returns early, we might not get an end date error
      // This is expected behavior for this scenario
    })

    test('should handle validation errors for invalid dates', async () => {
      const currentYear = new Date().getFullYear()
      const payload = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '1',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '31',
        'activity-end-date-month': '4',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
      expect(result).toContain('The end date must be a real date')
    })

    test('should handle validation errors for past dates', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload: {
          'activity-start-date-day': '15',
          'activity-start-date-month': '6',
          'activity-start-date-year': '2020',
          'activity-end-date-day': '16',
          'activity-end-date-month': '6',
          'activity-end-date-year': '2020'
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).not.toBeNull()

      const errorLinks = Array.from(errorSummary.querySelectorAll('a'))
      const errorTexts = errorLinks.map((link) => link.textContent.trim())

      const errorCounts = {}
      errorTexts.forEach((text) => {
        errorCounts[text] = (errorCounts[text] || 0) + 1
      })

      Object.values(errorCounts).forEach((count) => {
        expect(count).toBe(1)
      })

      // JOI custom validation returns on first error, so we expect start date error first
      // Verify that start date error is "today or in the future" (not "invalid")
      expect(errorTexts).toContain(
        'The start date must be today or in the future'
      )

      expect(errorTexts).not.toContain('The start date must be a real date')
      expect(errorTexts).not.toContain('The end date must be a real date')

      // Since JOI returns early, we may not get the end date error
      // This is expected behavior for custom validation
    })

    test('should not show duplicate error messages for past dates', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload: {
          'activity-start-date-day': '15',
          'activity-start-date-month': '6',
          'activity-start-date-year': '2025',
          'activity-end-date-day': '16',
          'activity-end-date-month': '6',
          'activity-end-date-year': '2025'
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).toBeTruthy()

      const errorLinks = Array.from(errorSummary.querySelectorAll('a'))
      const errorTexts = errorLinks.map((link) => link.textContent.trim())
      const uniqueErrors = new Set(errorTexts)
      expect(uniqueErrors.size).toBe(errorTexts.length)
    })

    test('should handle API errors gracefully', async () => {
      const apiPatchMock = jest.spyOn(Wreck, 'patch')
      apiPatchMock.mockRejectedValueOnce({
        res: { statusCode: 500 },
        data: {}
      })

      const currentYear = new Date().getFullYear()
      const payload = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '15',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(statusCode).toBe(statusCodes.internalServerError)
      expect(result).toContain('500')
    })

    test('should handle API validation errors', async () => {
      const apiPatchMock = jest.spyOn(Wreck, 'patch')
      apiPatchMock.mockRejectedValueOnce({
        data: {
          payload: {
            validation: {
              details: [
                {
                  path: ['start'],
                  message: 'CUSTOM_START_DATE_INVALID',
                  type: 'custom.startDate.invalid'
                }
              ]
            }
          }
        }
      })

      const currentYear = new Date().getFullYear()
      const payload = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '15',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Activity dates')
    })
  })

  describe('Error handling logic', () => {
    test('should correctly identify missing complete start date', () => {
      const h = {
        view: jest.fn().mockReturnThis(),
        takeover: jest.fn()
      }

      const err = {
        details: [
          {
            type: 'activity-start-date-day',
            path: ['activity-start-date-day']
          },
          {
            type: 'activity-start-date-month',
            path: ['activity-start-date-month']
          },
          {
            type: 'activity-start-date-year',
            path: ['activity-start-date-year']
          }
        ]
      }

      const request = { payload: {} }

      activityDatesSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalled()
      const viewCall = h.view.mock.calls[0]
      const viewData = viewCall[1]

      expect(viewData.startDateErrorMessage).toEqual({
        text: 'Enter the start date'
      })
    })

    test('should correctly identify custom validation errors', () => {
      const h = {
        view: jest.fn().mockReturnThis(),
        takeover: jest.fn()
      }

      const err = {
        details: [
          {
            type: 'custom.endDate.before.startDate',
            path: [],
            message: 'custom.endDate.before.startDate'
          }
        ]
      }

      const request = { payload: {} }

      activityDatesSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalled()
      const viewCall = h.view.mock.calls[0]
      const viewData = viewCall[1]

      expect(viewData.endDateErrorMessage).toEqual({
        text: 'The end date must be the same as or after the start date'
      })
      expect(viewData.errorSummary).toContainEqual({
        href: '#activity-end-date-day',
        text: 'The end date must be the same as or after the start date'
      })
    })

    test('should correctly handle individual field errors', () => {
      const h = {
        view: jest.fn().mockReturnThis(),
        takeover: jest.fn()
      }

      const err = {
        details: [
          {
            type: 'activity-start-date-day',
            path: ['activity-start-date-day'],
            message: 'activity-start-date-day'
          }
        ]
      }

      const request = { payload: {} }

      activityDatesSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalled()
      const viewCall = h.view.mock.calls[0]
      const viewData = viewCall[1]

      expect(viewData.startDateErrorMessage).toEqual({
        text: 'The start date must include a day'
      })
    })
  })
})
