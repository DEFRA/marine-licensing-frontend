import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import {
  MARINE_PLAN_POLICY_VIEW_ROUTE,
  marinePlanPolicyController
} from '#src/server/marine-licence/marine-plan-policy/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/services/marine-licence-service/index.js')

const licenceData = {
  projectName: 'Test Project',
  marinePlanPolicies: [
    { policyCode: 'SW-MPA-1', policy: 'MPA wording' },
    { policyCode: 'SW-BIO-1', policy: 'Biodiversity wording' }
  ],
  marinePlanPolicyResponses: { 'SW-BIO-1': 'My saved answer' }
}

describe('#marinePlanPolicyController (GET)', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({ id: 'lic-1' })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(licenceData)
    })
  })

  test('renders the policy with code heading, wording and find-out-more link', async () => {
    const h = { view: vi.fn() }
    await marinePlanPolicyController.handler(
      { params: { policyCode: 'SW-MPA-1' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(MARINE_PLAN_POLICY_VIEW_ROUTE, {
      pageTitle: 'SW-MPA-1',
      heading: 'SW-MPA-1',
      projectName: 'Test Project',
      policyText: 'MPA wording',
      findOutMoreUrl:
        'https://environment.data.gov.uk/marine-plans-explorer/policy/SW-MPA-1',
      backLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
      payload: { policyConsideration: '' }
    })
  })

  test('prefills the textarea from a previously saved response', async () => {
    const h = { view: vi.fn() }
    await marinePlanPolicyController.handler(
      { params: { policyCode: 'SW-BIO-1' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_VIEW_ROUTE,
      expect.objectContaining({
        payload: { policyConsideration: 'My saved answer' }
      })
    )
  })

  test('throws 404 when the marine licence id is missing from the cache', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValueOnce({})
    const h = { view: vi.fn() }

    await expect(
      marinePlanPolicyController.handler(
        { params: { policyCode: 'SW-BIO-1' } },
        h
      )
    ).rejects.toMatchObject({ output: { statusCode: 404 } })
    expect(h.view).not.toHaveBeenCalled()
  })

  test('throws 404 when the policy code is not in the licence', async () => {
    const h = { view: vi.fn() }

    await expect(
      marinePlanPolicyController.handler(
        { params: { policyCode: 'UNKNOWN-1' } },
        h
      )
    ).rejects.toMatchObject({ output: { statusCode: 404 } })
    expect(h.view).not.toHaveBeenCalled()
  })
})
