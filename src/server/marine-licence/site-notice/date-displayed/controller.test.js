import {
  siteNoticeDateDisplayedController,
  siteNoticeDateDisplayedSubmitController,
  SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/date-displayed/controller.js'
import { loadMarineLicence } from '#src/server/common/helpers/marine-licence/site-notice.js'
import { mockMarineLicenceWithApplicationTask } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import * as dateHelpers from '#src/server/common/helpers/dates/london-today.js'

vi.mock(
  '#src/server/common/helpers/marine-licence/site-notice.js',
  async () => {
    const actual = await vi.importActual(
      '#src/server/common/helpers/marine-licence/site-notice.js'
    )

    return {
      ...actual,
      loadMarineLicence: vi.fn()
    }
  }
)

vi.mock('#src/server/common/helpers/dates/london-today.js', () => ({
  londonToday: vi.fn()
}))

describe('#siteNoticeDateDisplayed', () => {
  const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`
  const loadedLicence = {
    marineLicence: mockMarineLicenceWithApplicationTask,
    marineLicenceId: mockMarineLicenceWithApplicationTask.id
  }

  beforeEach(() => {
    vi.mocked(loadMarineLicence).mockResolvedValue(loadedLicence)
    vi.mocked(dateHelpers.londonToday).mockReturnValue(
      new Date('2026-10-02T00:00:00.000Z')
    )
  })

  describe('#siteNoticeDateDisplayedController', () => {
    test('handler should render with correct context', async () => {
      const h = createMockH()

      await siteNoticeDateDisplayedController.handler(
        createMockRequest({
          params: {
            marineLicenceId: mockMarineLicenceWithApplicationTask.id
          },
          query: { evidence: '1' }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE,
        {
          backLink: displayUrl,
          pageTitle: 'When did you first display the notice?',
          heading: 'When did you first display the notice?',
          projectName: 'Test Project',
          locationIndex: 1,
          payload: {
            'date-displayed-day': '22',
            'date-displayed-month': '05',
            'date-displayed-year': '2026'
          }
        }
      )
    })

    test('redirects to view details when there is no site notice task', async () => {
      vi.mocked(loadMarineLicence).mockResolvedValue({
        ...loadedLicence,
        marineLicence: {
          ...mockMarineLicenceWithApplicationTask,
          applicationTasks: []
        }
      })
      const h = createMockH()

      await siteNoticeDateDisplayedController.handler(
        createMockRequest({
          params: { marineLicenceId: mockMarineLicenceWithApplicationTask.id }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceWithApplicationTask.id}`
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should handle API errors in catch block', async () => {
      const h = createMockH()

      const mockError = new Error('API Error')

      const mockRequest = createMockRequest({
        params: {
          marineLicenceId: mockMarineLicenceWithApplicationTask.id
        }
      })

      vi.mocked(loadMarineLicence).mockRejectedValue(mockError)

      await expect(
        siteNoticeDateDisplayedController.handler(mockRequest, h)
      ).rejects.toThrow('Error displaying site notice date displayed page')

      expect(h.view).not.toHaveBeenCalled()
    })
  })

  describe('#siteNoticeDateDisplayedSubmitController', () => {
    const validPayload = {
      'date-displayed-day': '15',
      'date-displayed-month': '3',
      'date-displayed-year': '2026'
    }

    beforeEach(() => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
    })

    test('saves the date displayed and redirects to site notice display', async () => {
      const h = createMockH()
      const request = createMockRequest({
        params: {
          marineLicenceId: mockMarineLicenceWithApplicationTask.id
        },
        query: { evidence: '1' },
        payload: validPayload
      })

      await siteNoticeDateDisplayedSubmitController.handler(request, h)

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        request,
        apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE,
        {
          dateDisplayed: { day: '15', month: '3', year: '2026' },
          id: mockMarineLicenceWithApplicationTask.id,
          evidenceIndex: 0
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(displayUrl)
    })

    test('redirects to view details without saving when there is no site notice task', async () => {
      vi.mocked(loadMarineLicence).mockResolvedValue({
        ...loadedLicence,
        marineLicence: {
          ...mockMarineLicenceWithApplicationTask,
          applicationTasks: []
        }
      })
      const h = createMockH()

      await siteNoticeDateDisplayedSubmitController.handler(
        createMockRequest({
          params: { marineLicenceId: mockMarineLicenceWithApplicationTask.id },
          query: { evidence: '1' },
          payload: validPayload
        }),
        h
      )

      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceWithApplicationTask.id}`
      )
    })

    test('failAction renders validation errors', async () => {
      const h = createMockH()
      const request = createMockRequest({
        params: { marineLicenceId: mockMarineLicenceWithApplicationTask.id },
        query: { evidence: '1' },
        payload: {
          'date-displayed-day': '',
          'date-displayed-month': '',
          'date-displayed-year': ''
        }
      })

      await siteNoticeDateDisplayedSubmitController.options.validate.failAction(
        request,
        h,
        {
          details: [
            {
              path: ['date-displayed-day'],
              message: 'DATE_DISPLAYED_REQUIRED',
              type: 'string.empty'
            },
            {
              path: ['date-displayed-month'],
              message: 'DATE_DISPLAYED_REQUIRED',
              type: 'string.empty'
            },
            {
              path: ['date-displayed-year'],
              message: 'DATE_DISPLAYED_REQUIRED',
              type: 'string.empty'
            }
          ]
        }
      )

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE,
        expect.objectContaining({
          projectName: 'Test Project',
          locationIndex: 1,
          backLink: displayUrl,
          errorSummary: [
            {
              href: '#date-displayed-day',
              text: 'Enter the date when you first displayed the notice',
              field: ['date-displayed-day']
            }
          ]
        })
      )
    })

    test('renders API validation errors', async () => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        {
          data: {
            payload: {
              validation: {
                details: [
                  {
                    path: ['dateDisplayed'],
                    message: 'DATE_DISPLAYED_DATE_TODAY_OR_PAST',
                    type: 'date.max'
                  }
                ]
              }
            }
          }
        }
      )
      const h = createMockH()

      await siteNoticeDateDisplayedSubmitController.handler(
        createMockRequest({
          params: { marineLicenceId: mockMarineLicenceWithApplicationTask.id },
          query: { evidence: '2' },
          payload: validPayload
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE,
        expect.objectContaining({
          errors: expect.objectContaining({
            'date-displayed-day': expect.objectContaining({
              text: 'Date you first displayed the notice cannot be in the future'
            })
          })
        })
      )
    })
    test('renders invalid date error when day/month/year combination is invalid', async () => {
      const h = createMockH()
      const request = createMockRequest({
        params: { marineLicenceId: mockMarineLicenceWithApplicationTask.id },
        query: { evidence: '1' },
        payload: {
          'date-displayed-day': '32',
          'date-displayed-month': '13',
          'date-displayed-year': '2026'
        }
      })

      await siteNoticeDateDisplayedSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE,
        expect.objectContaining({
          errors: expect.objectContaining({
            'date-displayed-day': expect.objectContaining({
              text: 'Date you first displayed the notice must be a valid date'
            })
          }),
          payload: {
            'date-displayed-day': '32',
            'date-displayed-month': '13',
            'date-displayed-year': '2026'
          }
        })
      )
    })

    test('renders future date error when date is in the future', async () => {
      vi.mocked(dateHelpers.londonToday).mockReturnValue(
        new Date('2026-03-01T00:00:00.000Z')
      )
      const h = createMockH()
      const request = createMockRequest({
        params: { marineLicenceId: mockMarineLicenceWithApplicationTask.id },
        query: { evidence: '1' },
        payload: {
          'date-displayed-day': '15',
          'date-displayed-month': '12',
          'date-displayed-year': '2027'
        }
      })

      await siteNoticeDateDisplayedSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE,
        expect.objectContaining({
          errors: expect.objectContaining({
            'date-displayed-day': expect.objectContaining({
              text: 'Date you first displayed the notice cannot be in the future'
            })
          }),
          payload: {
            'date-displayed-day': '15',
            'date-displayed-month': '12',
            'date-displayed-year': '2027'
          }
        })
      )
    })
  })
})
