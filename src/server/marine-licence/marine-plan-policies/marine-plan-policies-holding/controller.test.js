import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import {
  MARINE_PLAN_POLICIES_HOLDING_VIEW_ROUTE,
  marinePlanPoliciesHoldingController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policies-holding/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/marine-licence-service/index.js')

describe('#marinePlanPoliciesHoldingController', () => {
  const mockRequest = createMockRequest()

  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
      id: 'test-id'
    })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue({
        marinePlanPolicyJob: 'pending',
        projectName: 'Test Project'
      })
    })
  })

  test('should redirect to task list when no marine licence id in cache', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValueOnce({})

    const h = { redirect: vi.fn() }

    await marinePlanPoliciesHoldingController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should redirect to the Policy list page when marinePlanPolicyJob is ready', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue({ marinePlanPolicyJob: 'ready' })
      }
    )

    const h = { redirect: vi.fn() }

    await marinePlanPoliciesHoldingController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test.each(['pending', 'computing', 'failed'])(
    'should render the holding view when marinePlanPolicyJob is %s',
    async (marinePlanPolicyJob) => {
      vi.mocked(
        marineLicenceService.getMarineLicenceService
      ).mockReturnValueOnce({
        getMarineLicenceById: vi.fn().mockResolvedValue({
          marinePlanPolicyJob,
          projectName: 'Test Project'
        })
      })

      const h = { view: vi.fn() }

      await marinePlanPoliciesHoldingController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_PLAN_POLICIES_HOLDING_VIEW_ROUTE,
        {
          pageTitle: 'Marine plan policies',
          heading: 'Marine plan policies',
          projectName: 'Test Project',
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        }
      )
    }
  )
})
