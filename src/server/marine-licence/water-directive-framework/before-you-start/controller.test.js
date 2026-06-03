import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  waterFrameworkDirectiveBeforeYouStartController,
  WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START_VIEW_ROUTE
} from '#src/server/marine-licence/water-directive-framework/before-you-start/controller.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#waterFrameworkDirectiveBeforeYouStart', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#waterFrameworkDirectiveBeforeYouStartController', () => {
    test('handler should render with correct context', async () => {
      const h = createMockH()

      await waterFrameworkDirectiveBeforeYouStartController.handler(
        { yar: { get: vi.fn() } },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START_VIEW_ROUTE,
        {
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          continueLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
          pageTitle: 'Water Framework Directive',
          heading: 'Water Framework Directive',
          projectName: 'Test Project'
        }
      )
    })

    test('should provide expected response', async () => {
      const { statusCode } = await makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
