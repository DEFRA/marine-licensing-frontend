import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  siteNoticeDisplayController,
  SITE_NOTICE_DISPLAY_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/display/controller.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/marine-licence-service/index.js')

describe('#siteNoticeDisplay', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    ...mockMarineLicenceApplication,
    applicationReference: 'MLA/2026/10264',
    id: '64f1a2b3c4d5e6f7a8b9c0d1'
  }

  describe('#siteNoticeDisplayController', () => {
    test('handler should render with correct context', async () => {
      const mockService = {
        getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
      }
      vi.mocked(getMarineLicenceService).mockReturnValue(mockService)
      const h = createMockH()

      await siteNoticeDisplayController.handler(
        { params: { marineLicenceId: '64f1a2b3c4d5e6f7a8b9c0d1' } },
        h
      )

      expect(h.view).toHaveBeenCalledWith(SITE_NOTICE_DISPLAY_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        continueLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle: 'Display a site notice',
        heading: 'Display a site notice',
        pageCaption: 'MLA/2026/10264 - Test Project'
      })
    })

    test('should provide expected response', async () => {
      const mockService = {
        getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
      }
      vi.mocked(getMarineLicenceService).mockReturnValue(mockService)
      const { statusCode } = await makeGetRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicence.id}`,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
