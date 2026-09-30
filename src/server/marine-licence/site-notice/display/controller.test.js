import { vi } from 'vitest'
import {
  siteNoticeDisplayController,
  SITE_NOTICE_DISPLAY_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/display/controller.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/marine-licence-service/index.js')

describe('#siteNoticeDisplay', () => {
  const marineLicenceId = '64f1a2b3c4d5e6f7a8b9c0d1'

  const marineLicence = {
    ...mockMarineLicenceApplication,
    applicationReference: 'MLA/2026/10264',
    id: marineLicenceId
  }

  describe('#siteNoticeDisplayController', () => {
    test('handler should render with correct context', async () => {
      const mockService = {
        getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
      }
      vi.mocked(getMarineLicenceService).mockReturnValue(mockService)
      const h = createMockH()

      await siteNoticeDisplayController.handler(
        { params: { marineLicenceId } },
        h
      )

      const expectedViewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`

      expect(h.view).toHaveBeenCalledWith(SITE_NOTICE_DISPLAY_VIEW_ROUTE, {
        backLink: expectedViewDetailsUrl,
        cancelLink: expectedViewDetailsUrl,
        continueLink: expectedViewDetailsUrl,
        pageTitle: 'Display a site notice',
        heading: 'Display a site notice',
        pageCaption: 'MLA/2026/10264 - Test Project'
      })
    })

    test('Should handle API validation errors in catch block', async () => {
      const h = createMockH()

      getMarineLicenceService.mockRejectedValueOnce('API Error')

      const mockRequest = createMockRequest({ params: { marineLicenceId } })

      await expect(
        siteNoticeDisplayController.handler(mockRequest, h)
      ).rejects.toThrow('Error displaying site notice display page')

      expect(h.view).not.toHaveBeenCalled()
    })
  })
})
