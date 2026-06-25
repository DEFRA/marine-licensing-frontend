import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import {
  MARINE_PLAN_POLICY_QUERY_SPINNER_VIEW_ROUTE,
  marinePlanPolicyQuerySpinnerController
} from '#src/server/marine-licence/site-details/marine-plan-policy-query-spinner/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/marine-licence-service/index.js')

describe('#marinePlanPolicyQuerySpinner', () => {
  const mockRequest = createMockRequest()

  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
      id: 'test-id'
    })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue({ marinePlanPolicyJob: 'pending' })
    })
  })

  describe('marinePlanPolicyQuerySpinnerController', () => {
    test('should redirect to task list when no marine licence id in cache', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValueOnce({})

      const h = { redirect: vi.fn() }

      await marinePlanPolicyQuerySpinnerController.handler(mockRequest, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should redirect to task list when marinePlanPolicyJob is ready', async () => {
      vi.mocked(
        marineLicenceService.getMarineLicenceService
      ).mockReturnValueOnce({
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue({ marinePlanPolicyJob: 'ready' })
      })

      const h = { redirect: vi.fn() }

      await marinePlanPolicyQuerySpinnerController.handler(mockRequest, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should redirect to task list when marinePlanPolicyJob is failed', async () => {
      vi.mocked(
        marineLicenceService.getMarineLicenceService
      ).mockReturnValueOnce({
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue({ marinePlanPolicyJob: 'failed' })
      })

      const h = { redirect: vi.fn() }

      await marinePlanPolicyQuerySpinnerController.handler(mockRequest, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should render spinner view when job is not ready', async () => {
      const h = { view: vi.fn() }

      await marinePlanPolicyQuerySpinnerController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_PLAN_POLICY_QUERY_SPINNER_VIEW_ROUTE,
        {
          pageTitle: 'Calculating marine plan policies',
          heading: 'Calculating marine plan policies',
          pageRefreshTimeInSeconds: 2,
          isProcessing: true
        }
      )
    })
  })
})
