import {
  siteNoticeLocationNameController,
  siteNoticeLocationNameSubmitController,
  SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/location-name/controller.js'
import { loadMarineLicence } from '#src/server/common/helpers/marine-licence/site-notice.js'
import { mockMarineLicenceWithApplicationTask } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'

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

describe('#siteNoticeLocationName', () => {
  const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`
  const marineLicenceId = mockMarineLicenceWithApplicationTask.id
  const loadedLicence = {
    marineLicence: mockMarineLicenceWithApplicationTask,
    marineLicenceId
  }

  beforeEach(() => {
    vi.mocked(loadMarineLicence).mockResolvedValue(loadedLicence)
  })

  describe('#siteNoticeLocationNameController', () => {
    test('handler should render with correct context', async () => {
      const h = createMockH()

      await siteNoticeLocationNameController.handler(
        createMockRequest({
          marineLicence: mockMarineLicenceWithApplicationTask,
          params: { marineLicenceId },
          query: { location: '1' }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE,
        {
          backLink: `${displayUrl}#site-location-1`,
          pageTitle: 'Location name',
          heading: 'Location name',
          projectName: 'Test Project',
          locationIndex: 1,
          payload: {
            locationName: 'North pier'
          }
        }
      )
    })

    test('redirects to view details when there is no site notice task', async () => {
      const h = createMockH()

      await siteNoticeLocationNameController.handler(
        createMockRequest({
          marineLicence: {
            ...mockMarineLicenceWithApplicationTask,
            applicationTasks: []
          },
          params: { marineLicenceId }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceWithApplicationTask.id}`
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should handle unexpected errors in catch block', async () => {
      const h = createMockH()
      h.view.mockImplementation(() => {
        throw new Error('render failed')
      })

      await expect(
        siteNoticeLocationNameController.handler(
          createMockRequest({
            marineLicence: mockMarineLicenceWithApplicationTask,
            params: { marineLicenceId },
            query: { location: '1' }
          }),
          h
        )
      ).rejects.toThrow('Error displaying site notice location name page')
    })
  })

  describe('#siteNoticeLocationNameSubmitController', () => {
    const locationName = 'Tynemouth harbour, noticeboard by north pier'

    beforeEach(() => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
    })

    test('saves the location name and redirects to site notice display', async () => {
      const h = createMockH()
      const request = createMockRequest({
        marineLicence: mockMarineLicenceWithApplicationTask,
        params: { marineLicenceId },
        query: { location: '1' },
        payload: { locationName }
      })

      await siteNoticeLocationNameSubmitController.handler(request, h)

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        request,
        apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE,
        {
          locationName,
          id: mockMarineLicenceWithApplicationTask.id,
          evidenceIndex: 0
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(displayUrl)
    })

    test('redirects to view details without saving when there is no site notice task', async () => {
      const h = createMockH()

      await siteNoticeLocationNameSubmitController.handler(
        createMockRequest({
          marineLicence: {
            ...mockMarineLicenceWithApplicationTask,
            applicationTasks: []
          },
          params: { marineLicenceId },
          query: { location: '1' },
          payload: { locationName }
        }),
        h
      )

      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceWithApplicationTask.id}`
      )
    })

    test('failAction renders the location name error', async () => {
      const h = createMockH()
      const request = createMockRequest({
        params: { marineLicenceId },
        query: { location: '1' },
        payload: { locationName: '' }
      })

      await siteNoticeLocationNameSubmitController.options.validate.failAction(
        request,
        h,
        {
          details: [
            {
              path: ['locationName'],
              message: 'LOCATION_NAME_REQUIRED',
              type: 'string.empty'
            }
          ]
        }
      )

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE,
        expect.objectContaining({
          projectName: 'Test Project',
          locationIndex: 1,
          backLink: `${displayUrl}#site-location-1`,
          errors: expect.objectContaining({
            locationName: expect.objectContaining({
              text: 'Enter the location name'
            })
          })
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
                    path: ['locationName'],
                    message: 'LOCATION_NAME_MAX_LENGTH',
                    type: 'string.max'
                  }
                ]
              }
            }
          }
        }
      )
      const h = createMockH()

      await siteNoticeLocationNameSubmitController.handler(
        createMockRequest({
          marineLicence: mockMarineLicenceWithApplicationTask,
          params: { marineLicenceId },
          query: { location: '2' },
          payload: { locationName }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE,
        expect.objectContaining({
          errors: expect.objectContaining({
            locationName: expect.objectContaining({
              text: 'Location name must be 250 characters or fewer'
            })
          })
        })
      )
      expect(h.redirect).not.toHaveBeenCalled()
    })
  })
})
