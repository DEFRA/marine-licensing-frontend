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

  afterEach(() => {
    vi.restoreAllMocks()
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

      const r = await siteNoticeDisplayController.handler(
        createMockRequest({
          params: {
            marineLicenceId: mockMarineLicenceWithApplicationTask.id
          }
        }),
        h
      )

      const expectedViewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceWithApplicationTask.id}`

      expect(h.view).toHaveBeenCalledWith(SITE_NOTICE_DISPLAY_VIEW_ROUTE, {
        backLink: expectedViewDetailsUrl,
        cancelLink: expectedViewDetailsUrl,
        continueLink: expectedViewDetailsUrl,
        pageTitle: 'Display a site notice',
        heading: 'Display a site notice',
        pageCaption: 'MLA/2026/10264 - Test Project',
        showCommunityUserSection: true,
        showMarineUserSection: true,
        showMultipleSitesSection: false
      })
    })

    test('Should handle API validation errors in catch block', async () => {
      const h = createMockH()

      getMarineLicenceService.mockRejectedValueOnce('API Error')

      const mockRequest = createMockRequest({
        params: {
          marineLicenceId: mockMarineLicenceWithApplicationTask.id
        }
      })

      await expect(
        siteNoticeDisplayController.handler(mockRequest, h)
      ).rejects.toThrow('Error displaying site notice display page')

      expect(h.view).not.toHaveBeenCalled()
    })
  })
})
