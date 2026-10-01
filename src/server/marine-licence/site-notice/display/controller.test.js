import {
  siteNoticeDisplayController,
  SITE_NOTICE_DISPLAY_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/display/controller.js'
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

describe('#siteNoticeDisplay', () => {
  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  describe('#siteNoticeDisplayController', () => {
    test('handler should render with correct context', async () => {
      const mockService = {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue(mockMarineLicenceWithApplicationTask)
      }
      vi.mocked(getMarineLicenceService).mockReturnValue(mockService)
      const h = createMockH()

      await siteNoticeDisplayController.handler(
        createMockRequest({
          params: {
            marineLicenceId: mockMarineLicenceWithApplicationTask.id
          }
        }),
        h
      )

      const licenceId = mockMarineLicenceWithApplicationTask.id
      const expectedViewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${licenceId}`

      expect(h.view).toHaveBeenCalledWith(SITE_NOTICE_DISPLAY_VIEW_ROUTE, {
        backLink: expectedViewDetailsUrl,
        pageTitle: 'Display a site notice',
        heading: 'Display a site notice',
        pageCaption: 'MLA/2026/10264 - Test Project',
        evidenceLinks: {
          locationName: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/${licenceId}`,
          dateDisplayed: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DATE_DISPLAYED}/${licenceId}`,
          closeUpPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${licenceId}`,
          positionPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/${licenceId}`
        },
        showCommunityUserSection: true,
        showMarineUserSection: true,
        showMultipleSitesSection: false,
        siteNoticeEvidence: []
      })
    })

    test('redirects to view details when there is no site notice task', async () => {
      vi.mocked(getMarineLicenceService).mockReturnValue({
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceWithApplicationTask,
          applicationTasks: []
        })
      })
      const h = createMockH()

      await siteNoticeDisplayController.handler(
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
        siteNoticeDisplayController.handler(mockRequest, h)
      ).rejects.toThrow('Error displaying site notice display page')

      expect(h.view).not.toHaveBeenCalled()
    })
  })
})
