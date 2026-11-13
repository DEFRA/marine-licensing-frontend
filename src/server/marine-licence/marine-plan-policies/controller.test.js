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
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import { mockMarineLicenceWithMarinePlanPolicies } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/marine-licence-service/index.js')

describe('#marinePlanPoliciesController', () => {
  const mockRequest = createMockRequest()

  const incomplete = {
    tag: { text: 'Incomplete', classes: 'govuk-tag--red' }
  }

  const row = (policyCode, text, status = incomplete) => ({
    title: { text, classes: 'govuk-link--no-visited-state' },
    href: getMarinePlanPolicyLink(policyCode),
    status
  })

  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
      id: 'test-id'
    })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue(mockMarineLicenceWithMarinePlanPolicies)
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

  test('does not clear the returnTo cache when there is no marine licence id in the cache', async () => {
    const request = createMockRequest()
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValueOnce({})
    const h = { view: vi.fn() }

    await expect(
      marinePlanPoliciesController.handler(request, h)
    ).rejects.toMatchObject({ output: { statusCode: 404 } })
    expect(request.yar.clear).not.toHaveBeenCalled()
    expect(request.yar.flash).not.toHaveBeenCalled()
  })

  test('renders policies as "title (code)" rows under alphabetical section headings, sorted by code, all "Incomplete"', async () => {
    const h = { view: vi.fn() }

    await marinePlanPoliciesController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(MARINE_PLAN_POLICIES_VIEW_ROUTE, {
      pageTitle: 'Marine plan policies',
      heading: 'Marine plan policies',
      projectName: 'Test Project',
      policiesCountText: '3 policies to complete',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      taskListLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      marinePlanPolicyGuidanceLink:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
      sections: [
        {
          heading: 'Economic',
          slug: 'economic',
          items: [row('SW-AGG-2', 'South West Aggregates 2 (SW-AGG-2)')]
        },
        {
          heading: 'Environmental',
          slug: 'environmental',
          items: [
            row('SW-BIO-1', 'South West Biodiversity 1 (SW-BIO-1)'),
            row('SW-MPA-1', 'South West Marine protected areas 1 (SW-MPA-1)')
          ]
        },
        {
          heading: 'Supporting documents',
          slug: 'supporting-documents',
          items: [
            {
              hint: {
                text: ''
              },
              href: '/marine-licence/marine-plan-policy/supporting-document-upload',
              status: {
                text: 'Completed'
              },
              title: {
                classes: 'govuk-link--no-visited-state',
                text: 'Upload supporting documents'
              }
            }
          ]
        }
      ]
    })
  })

  test('marks answered policies Completed and shows the completed count', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceWithMarinePlanPolicies,
          projectName: 'Test Project',
          marinePlanPolicyResponses: {
            'SW-BIO-1': { response: 'A considered answer' }
          }
        })
      }
    )
    const h = { view: vi.fn() }

    await marinePlanPoliciesController.handler(mockRequest, h)

    const model = h.view.mock.calls[0][1]
    expect(model.policiesCountText).toBe('1 of 3 policies completed')
    expect(model.sections[1].items).toEqual([
      row('SW-BIO-1', 'South West Biodiversity 1 (SW-BIO-1)', {
        text: 'Completed'
      }),
      row('SW-MPA-1', 'South West Marine protected areas 1 (SW-MPA-1)')
    ])
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
        sections: [],
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

  test('clears any stale returnTo so list-flow considerations return to the list', async () => {
    const request = createMockRequest()
    const h = { view: vi.fn() }

    await marinePlanPoliciesController.handler(request, h)

    expect(request.yar.clear).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
  })
})
