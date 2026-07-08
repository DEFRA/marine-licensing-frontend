import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import {
  MARINE_PLAN_POLICIES_VIEW_ROUTE,
  marinePlanPoliciesController
} from '#src/server/marine-licence/marine-plan-policies/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

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
      marinePlanPoliciesGuidanceLink:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_GUIDANCE,
      policies: [
        {
          title: { text: 'SW-AGG-2' },
          href: getMarinePlanPolicyLink('SW-AGG-2'),
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        },
        {
          title: { text: 'SW-BIO-1' },
          href: getMarinePlanPolicyLink('SW-BIO-1'),
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        },
        {
          title: { text: 'SW-MPA-1' },
          href: getMarinePlanPolicyLink('SW-MPA-1'),
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        }
      ]
    })
  })

  test('marks answered policies Completed and shows the completed count', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          projectName: 'Test Project',
          marinePlanPoliciesCount: 3,
          marinePlanPolicies: [
            { policyCode: 'SW-MPA-1' },
            { policyCode: 'SW-AGG-2' },
            { policyCode: 'SW-BIO-1' }
          ],
          marinePlanPolicyResponses: { 'SW-BIO-1': 'A considered answer' }
        })
      }
    )
    const h = { view: vi.fn() }

    await marinePlanPoliciesController.handler(mockRequest, h)

    const model = h.view.mock.calls[0][1]
    expect(model.policiesCountText).toBe('1 of 3 policies completed')
    const bioRow = model.policies.find((row) => row.title.text === 'SW-BIO-1')
    expect(bioRow.status).toEqual({ text: 'Completed' })
    const aggRow = model.policies.find((row) => row.title.text === 'SW-AGG-2')
    expect(aggRow.status).toEqual({
      tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
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
