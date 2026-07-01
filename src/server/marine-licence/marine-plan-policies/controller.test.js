import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import {
  MARINE_PLAN_POLICIES_VIEW_ROUTE,
  marinePlanPoliciesController
} from '#src/server/marine-licence/marine-plan-policies/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/marine-licence-service/index.js')

describe('#marinePlanPoliciesController', () => {
  const mockRequest = createMockRequest()

  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
      id: 'test-id'
    })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue({
        projectName: 'Test Project',
        marinePlanPoliciesCount: 3,
        marinePlanPolicies: [
          { policyCode: 'SW-MPA-1' },
          { policyCode: 'SW-AGG-2' },
          { policyCode: 'SW-BIO-1' }
        ]
      })
    })
  })

  test('throws 404 when there is no marine licence id in the cache', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValueOnce({})
    const h = { view: vi.fn() }

    await expect(
      marinePlanPoliciesController.handler(mockRequest, h)
    ).rejects.toMatchObject({ output: { statusCode: 404 } })
    expect(h.view).not.toHaveBeenCalled()
  })

  test('renders policies sorted by code as plain rows with a "Not yet started" tag', async () => {
    const h = { view: vi.fn() }

    await marinePlanPoliciesController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(MARINE_PLAN_POLICIES_VIEW_ROUTE, {
      pageTitle: 'Marine plan policies',
      heading: 'Marine plan policies',
      projectName: 'Test Project',
      policiesCountText: '3 policies to complete',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      taskListLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      policies: [
        {
          title: { text: 'SW-AGG-2' },
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        },
        {
          title: { text: 'SW-BIO-1' },
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        },
        {
          title: { text: 'SW-MPA-1' },
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        }
      ]
    })
  })

  test('renders an empty list does not crash when there are no policies', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          projectName: 'Test Project',
          marinePlanPoliciesCount: 0
        })
      }
    )
    const h = { view: vi.fn() }

    await marinePlanPoliciesController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICIES_VIEW_ROUTE,
      expect.objectContaining({
        policies: [],
        policiesCountText: '0 policies to complete'
      })
    )
  })

  test('uses singular wording when there is exactly one policy', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          projectName: 'Test Project',
          marinePlanPoliciesCount: 1,
          marinePlanPolicies: [{ policyCode: 'SW-AGG-2' }]
        })
      }
    )
    const h = { view: vi.fn() }

    await marinePlanPoliciesController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICIES_VIEW_ROUTE,
      expect.objectContaining({ policiesCountText: '1 policy to complete' })
    )
  })
})
