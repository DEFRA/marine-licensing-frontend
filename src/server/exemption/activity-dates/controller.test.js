import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import Wreck from '@hapi/wreck'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { JOI_ERRORS } from '../../common/constants/joi.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('Activity Dates Controller', () => {
  let server
  let getExemptionCacheSpy

  const RealDate = Date

  const mockExemptionState = {}

  beforeAll(async () => {
    global.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          return new RealDate('2020-01-01T00:00:00Z')
        }
        return new RealDate(...args)
      }
    }

    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)
  })

  afterAll(async () => {
    global.Date = RealDate
    await server.stop()
  })

  describe('GET /activity-dates', () => {
    it('Should return 200 and the activity dates view with no data on first request', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.ACTIVITY_DATES
      })
      const { document } = new JSDOM(result).window

      expect(statusCode).toBe(statusCodes.ok)

      const fieldIds = [
        'activity-start-date-day',
        'activity-start-date-month',
        'activity-start-date-year',
        'activity-end-date-day',
        'activity-end-date-month',
        'activity-end-date-year'
      ]
      for (const fieldId of fieldIds) {
        const input = document.getElementById(fieldId)
        expect(input).not.toBeNull()
        expect(input.value).toBe('')
      }
    })

    it('Should return 200 and the activity dates view with pre-populated data', async () => {
      mockExemptionState.activityDates = {
        start: new Date('2025-05-27'),
        end: new Date('2025-05-30')
      }

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.ACTIVITY_DATES
      })
      const { document } = new JSDOM(result).window

      expect(statusCode).toBe(statusCodes.ok)

      const fieldValues = {
        'activity-start-date-day': '27',
        'activity-start-date-month': '5',
        'activity-start-date-year': '2025',
        'activity-end-date-day': '30',
        'activity-end-date-month': '5',
        'activity-end-date-year': '2025'
      }

      for (const [fieldId, value] of Object.entries(fieldValues)) {
        const input = document.getElementById(fieldId)
        expect(input).not.toBeNull()
        expect(input.value).toBe(value)
      }
    })
  })

  describe('POST /activity-dates', () => {
    it('Should show error message for missing start date', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload: {
          'activity-start-date-day': '',
          'activity-start-date-month': 5,
          'activity-start-date-year': 2025,
          'activity-end-date-day': 30,
          'activity-end-date-month': 5,
          'activity-end-date-year': 2025
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(document.querySelector('h2').textContent.trim()).toBe(
        'There is a problem'
      )
      expect(
        document.querySelector('.govuk-error-summary ul li a').textContent
      ).toBe('The start date must include a day')
    })

    it('Should show custom message when all three end date fields are missing', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload: {
          'activity-start-date-day': '',
          'activity-start-date-month': '',
          'activity-start-date-year': '',
          'activity-end-date-day': '',
          'activity-end-date-month': '',
          'activity-end-date-year': ''
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(document.querySelector('h2').textContent.trim()).toBe(
        'There is a problem'
      )
      expect(
        document.querySelector('.govuk-error-summary ul li:first-child a')
          .textContent
      ).toBe('Enter the start date')
      expect(
        document.querySelector('.govuk-error-summary ul li:nth-child(2) a')
          .textContent
      ).toBe('Enter the end date')
    })

    it('Should show stacked error messages for two missing date values for start and end', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload: {
          'activity-start-date-day': '',
          'activity-start-date-month': '',
          'activity-start-date-year': 2025,
          'activity-end-date-day': '',
          'activity-end-date-month': '',
          'activity-end-date-year': 2025
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(document.querySelector('h2').textContent.trim()).toBe(
        'There is a problem'
      )
      expect(
        document.querySelector('.govuk-error-summary ul li:first-child a')
          .textContent
      ).toBe('The start date must include a day')
      expect(
        document.querySelector('.govuk-error-summary ul li:nth-child(2) a')
          .textContent
      ).toBe('The start date must include a month')
      expect(
        document.querySelector('.govuk-error-summary ul li:nth-child(3) a')
          .textContent
      ).toBe('The end date must include a day')
      expect(
        document.querySelector('.govuk-error-summary ul li:nth-child(4) a')
          .textContent
      ).toBe('The end date must include a month')
    })

    it('Should return 302 and redirect to task list on success', async () => {
      jest.spyOn(Wreck, 'patch').mockImplementationOnce(() => jest.fn())
      getExemptionCacheSpy.mockReturnValueOnce(mockExemption)
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload: {
          'activity-start-date-day': 27,
          'activity-start-date-month': 5,
          'activity-start-date-year': 2025,
          'activity-end-date-day': 30,
          'activity-end-date-month': 5,
          'activity-end-date-year': 2025
        }
      })
      expect(Wreck.patch).toHaveBeenCalledWith(
        `${config.get('backend').apiUrl}/exemption/activity-dates`,
        {
          payload: {
            id: mockExemption.id,
            start: new Date('2025-05-27'),
            end: new Date('2025-05-30')
          }
        }
      )
      expect(statusCode).toBe(302)
      expect(headers.location).toBe(routes.TASK_LIST)
    })

    it('Should show error messages with invalid date from API', async () => {
      const apiPatchMock = jest.spyOn(Wreck, 'patch')
      apiPatchMock.mockRejectedValueOnce({
        res: { statusCode: 400 },
        data: {
          validation: {
            details: [
              {
                field: 'start',
                type: 'date.min',
                message: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE
              }
            ]
          }
        }
      })

      const { result } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload: {
          'activity-start-date-day': 27,
          'activity-start-date-month': 5,
          'activity-start-date-year': 2025,
          'activity-end-date-day': 30,
          'activity-end-date-month': 5,
          'activity-end-date-year': 2025
        }
      })

      expect(apiPatchMock).toHaveBeenCalled()
      const { document } = new JSDOM(result).window
      expect(document.querySelector('h2').textContent.trim()).toBe(
        'There is a problem'
      )
    })

    test('Should pass error to global catchAll behaviour if it is not a validation error', async () => {
      jest.spyOn(Wreck, 'patch').mockRejectedValueOnce(
        Object.assign(new Error('Validation error'), {
          data: {
            payload: {
              validation: {
                details: [{ message: 'mock validation message' }]
              }
            }
          }
        })
      )

      const { result } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DATES,
        payload: {
          'activity-start-date-day': 27,
          'activity-start-date-month': 5,
          'activity-start-date-year': 2025,
          'activity-end-date-day': 30,
          'activity-end-date-month': 5,
          'activity-end-date-year': 2025
        }
      })

      expect(result).toContain('Something went wrong')

      const { document } = new JSDOM(result).window
      expect(document.querySelector('h1').textContent.trim()).toBe('500')
    })
  })
})
