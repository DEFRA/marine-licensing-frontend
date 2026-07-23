import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import * as marinePlanPolicyWait from '#src/server/common/helpers/marine-licence/marine-plan-policy-wait.js'
import {
  CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE,
  calculateMarinePlanPoliciesAndWaitController
} from '#src/server/marine-licence/marine-plan-policies/calculate-marine-plan-policies-and-wait/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/marine-licence-service/index.js')
vi.mock('~/src/server/common/helpers/marine-licence/marine-plan-policy-wait.js')

describe('#calculateMarinePlanPoliciesAndWaitController', () => {
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
    vi.mocked(
      marinePlanPolicyWait.getMarinePlanPolicyQueryStartTime
    ).mockReturnValue(undefined)
  })

  test('should redirect to task list when no marine licence id in cache', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValueOnce({})

    const h = { redirect: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should redirect to task list when marinePlanPolicyJob is ready', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue({ marinePlanPolicyJob: 'ready' })
      }
    )

    const h = { redirect: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should redirect to task list when marinePlanPolicyJob is failed', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue({ marinePlanPolicyJob: 'failed' })
      }
    )

    const h = { redirect: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should render spinner view when job is not ready', async () => {
    const h = { view: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(
      CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE,
      {
        pageTitle: 'Loading your Marine plan policies',
        heading: 'Loading your Marine plan policies',
        pageRefreshTimeInMs: 2000
      }
    )
  })

  test('should render spinner view when job is computing', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue({ marinePlanPolicyJob: 'computing' })
      }
    )

    const h = { view: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(
      CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE,
      {
        pageTitle: 'Loading your Marine plan policies',
        heading: 'Loading your Marine plan policies',
        pageRefreshTimeInMs: 2000
      }
    )
  })

  test('should render spinner view when under the 50 second wait limit', async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    vi.mocked(
      marinePlanPolicyWait.getMarinePlanPolicyQueryStartTime
    ).mockReturnValue(now - 49_000)

    const h = { view: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(
      CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE,
      expect.any(Object)
    )
  })

  test('should redirect to task list when the 50 second wait limit is reached and job is pending', async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    vi.mocked(
      marinePlanPolicyWait.getMarinePlanPolicyQueryStartTime
    ).mockReturnValue(now - 50_000)

    const h = { redirect: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should redirect to task list when the 50 second wait limit is reached and job is computing', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue({ marinePlanPolicyJob: 'computing' })
      }
    )
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    vi.mocked(
      marinePlanPolicyWait.getMarinePlanPolicyQueryStartTime
    ).mockReturnValue(now - 60_000)

    const h = { redirect: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
