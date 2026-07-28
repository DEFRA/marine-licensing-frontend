import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import * as marinePlanPolicyQuery from '#src/server/common/helpers/marine-licence/marine-plan-policy-query.js'
import {
  CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE,
  calculateMarinePlanPoliciesAndWaitController
} from '#src/server/marine-licence/marine-plan-policies/calculate-marine-plan-policies-and-wait/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/marine-licence-service/index.js')
vi.mock(
  '~/src/server/common/helpers/marine-licence/marine-plan-policy-query.js'
)

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
      marinePlanPolicyQuery.getMarinePlanPolicyQueryStartTime
    ).mockReturnValue(undefined)
    vi.mocked(
      marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
    ).mockResolvedValue(undefined)
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
    expect(
      marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
    ).not.toHaveBeenCalled()
  })

  test('should re-trigger the query and render the spinner when marinePlanPolicyJob is failed and site details are completed', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          marinePlanPolicyJob: 'failed',
          taskList: { siteDetails: 'COMPLETED' }
        })
      }
    )

    const h = { redirect: vi.fn(), view: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(
      marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
    ).toHaveBeenCalledWith(mockRequest, 'test-id')
    expect(h.view).toHaveBeenCalledWith(
      CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE,
      {
        pageTitle: 'Loading your Marine plan policies',
        heading: 'Loading your Marine plan policies',
        pageRefreshTimeInMs: 2000
      }
    )
    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('should redirect to task list when marinePlanPolicyJob is failed and site details are not completed', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          marinePlanPolicyJob: 'failed',
          taskList: { siteDetails: 'IN_PROGRESS' }
        })
      }
    )

    const h = { redirect: vi.fn(), view: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(
      marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
    ).not.toHaveBeenCalled()
  })

  test('should redirect to task list when marinePlanPolicyJob is failed and taskList is missing', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue({ marinePlanPolicyJob: 'failed' })
      }
    )

    const h = { redirect: vi.fn(), view: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(
      marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
    ).not.toHaveBeenCalled()
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
    expect(
      marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
    ).not.toHaveBeenCalled()
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
    expect(
      marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
    ).not.toHaveBeenCalled()
  })

  test('should render spinner view when under the 50 second wait limit', async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    vi.mocked(
      marinePlanPolicyQuery.getMarinePlanPolicyQueryStartTime
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
      marinePlanPolicyQuery.getMarinePlanPolicyQueryStartTime
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
      marinePlanPolicyQuery.getMarinePlanPolicyQueryStartTime
    ).mockReturnValue(now - 60_000)

    const h = { redirect: vi.fn() }

    await calculateMarinePlanPoliciesAndWaitController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
