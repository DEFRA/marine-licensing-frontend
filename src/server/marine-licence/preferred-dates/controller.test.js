import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  preferredDatesController,
  preferredDatesSubmitController,
  PREFERRED_DATES_VIEW_ROUTE
} from '#src/server/marine-licence/preferred-dates/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/schemas/date-schema-utils.js', () => ({
  threeMonthsFromNow: vi.fn().mockReturnValue('8 2026'),
  fifteenMonthsFromNow: vi.fn().mockReturnValue('8 2027')
}))

const START_DATE_HINT = '8 2026'
const END_DATE_HINT = '8 2027'

describe('#preferredDates', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    preferredDates: {
      start: { month: '07', year: '2026' },
      end: { month: '08', year: '2027' }
    }
  }

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: { id: mockLicence.id }
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#preferredDatesController', () => {
    test('handler should render with correct context when cached dates exist', () => {
      const h = createMockH()

      preferredDatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(PREFERRED_DATES_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'What are your preferred start and end dates for the licence?',
        startDateHint: START_DATE_HINT,
        heading: 'What are your preferred start and end dates for the licence?',
        endDateHint: END_DATE_HINT,
        projectName: mockLicence.projectName,
        payload: {
          'start-date-month': '07',
          'start-date-year': '2026',
          'end-date-month': '08',
          'end-date-year': '2027'
        }
      })
    })

    test('handler should render with empty payload when no cached dates', () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValueOnce({
        projectName: 'Test'
      })
      const h = createMockH()

      preferredDatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(PREFERRED_DATES_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'What are your preferred start and end dates for the licence?',
        startDateHint: START_DATE_HINT,
        heading: 'What are your preferred start and end dates for the licence?',
        endDateHint: END_DATE_HINT,
        projectName: 'Test',
        payload: {}
      })
    })
  })

  describe('#preferredDatesSubmitController', () => {
    test('Should pass error to global catchAll behaviour if it contains no validation data', async () => {
      const thrownError = { res: { statusCode: 500 }, data: {} }
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        thrownError
      )
      const h = createMockH()

      await expect(
        preferredDatesSubmitController.handler(
          {
            payload: {
              'start-date-month': '7',
              'start-date-year': '2026',
              'end-date-month': '8',
              'end-date-year': '2027'
            }
          },
          h
        )
      ).rejects.toBe(thrownError)
      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('Should correctly redirect to the task list on success', async () => {
      const h = createMockH()

      await preferredDatesSubmitController.handler(
        {
          payload: {
            'start-date-month': '7',
            'start-date-year': '2026',
            'end-date-month': '8',
            'end-date-year': '2027'
          }
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/preferred-dates',
        {
          id: mockLicence.id,
          start: { month: '07', year: '2026' },
          end: { month: '08', year: '2027' }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('Should handle API validation errors in catch block', async () => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        {
          data: {
            payload: {
              validation: {
                details: [
                  {
                    path: ['start'],
                    message: 'START_DATE_REQUIRED',
                    type: 'any.required'
                  }
                ]
              }
            }
          }
        }
      )

      const h = createMockH()

      await preferredDatesSubmitController.handler(
        {
          payload: {
            'start-date-month': '',
            'start-date-year': '',
            'end-date-month': '',
            'end-date-year': ''
          }
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        PREFERRED_DATES_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          projectName: mockLicence.projectName
        })
      )
    })
  })
})
