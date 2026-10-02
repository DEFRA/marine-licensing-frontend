import {
  siteNoticeDateDisplayedController,
  siteNoticeDateDisplayedSubmitController,
  SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/date-displayed/controller.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  mockMarineLicenceWithApplicationTask,
  mockApplicationTaskContactId
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

describe('#siteNoticeDateDisplayed', () => {
  const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  describe('#siteNoticeDateDisplayedController', () => {
    test('handler should render with correct context', async () => {
      const mockService = {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue(mockMarineLicenceWithApplicationTask)
      }
      vi.mocked(getMarineLicenceService).mockReturnValue(mockService)
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
          locationIndex: 1
        }
      )
    })

    test('redirects to view details when there is no site notice task', async () => {
      vi.mocked(getMarineLicenceService).mockReturnValue({
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceWithApplicationTask,
          applicationTasks: []
        })
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

      getMarineLicenceService.mockReturnValue({
        getMarineLicenceById: vi.fn().mockRejectedValue(mockError)
      })

      await expect(
        siteNoticeDateDisplayedController.handler(mockRequest, h)
      ).rejects.toThrow('Error displaying site notice date displayed page')

      expect(h.view).not.toHaveBeenCalled()
    })
  })

  describe('#siteNoticeDateDisplayedSubmitController', () => {
    test('redirects to site notice display', () => {
      const h = createMockH()

      siteNoticeDateDisplayedSubmitController.handler(
        createMockRequest({
          params: {
            marineLicenceId: mockMarineLicenceWithApplicationTask.id
          }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(displayUrl)
    })
  })
})
