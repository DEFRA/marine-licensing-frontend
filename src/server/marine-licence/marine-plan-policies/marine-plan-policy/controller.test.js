import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import {
  MARINE_PLAN_POLICY_VIEW_ROUTE,
  marinePlanPolicyController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const cyaReturnLink = (slug) =>
  `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#marine-plan-policies-card-${slug}`

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/services/marine-licence-service/index.js')

const licenceData = {
  projectName: 'Test Project',
  marinePlanPolicies: [
    {
      policyCode: 'SW-MPA-1',
      title: 'South West Marine protected areas 1',
      category: 'Environmental',
      policy: 'MPA wording'
    },
    { policyCode: 'SW-BIO-1', policy: 'Biodiversity wording' }
  ],
  marinePlanPolicyResponses: { 'SW-BIO-1': { response: 'My saved answer' } }
}

describe('#marinePlanPolicyController (GET)', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({ id: 'lic-1' })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(licenceData)
    })
  })

  test("back link targets the policy's section card on check your answers when returnTo is set", async () => {
    const h = { view: vi.fn() }
    await marinePlanPolicyController.handler(
      {
        params: { policyCode: 'SW-MPA-1' },
        yar: {
          get: vi
            .fn()
            .mockReturnValue(
              marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
            ),
          clear: vi.fn()
        }
      },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_VIEW_ROUTE,
      expect.objectContaining({ backLink: cyaReturnLink('environmental') })
    )
  })
})

import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  marinePlanPolicySubmitController,
  errorMessages
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy/controller.js'

const validate = (payload) =>
  marinePlanPolicySubmitController.options.validate.payload.validate(payload)

describe('#marinePlanPolicySubmitController (POST)', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({ id: 'lic-1' })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(licenceData)
    })
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
  })

  test('accepts a response of exactly 2000 characters', () => {
    const { error } = validate({ policyConsideration: 'a'.repeat(2000) })
    expect(error).toBeUndefined()
  })

  test('saves the response and redirects to the policy list on success', async () => {
    const h = {
      redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
      view: vi.fn()
    }

    await marinePlanPolicySubmitController.handler(
      {
        params: { policyCode: 'SW-BIO-1' },
        payload: { policyConsideration: 'My considered answer' }
      },
      h
    )

    expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      '/marine-licence/marine-plan-policy-response',
      {
        id: 'lic-1',
        policyCode: 'SW-BIO-1',
        response: 'My considered answer',
        requiresDocumentation: false
      }
    )
    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test('sends requiresDocumentation true when the documentation checkbox is checked', async () => {
    const h = {
      redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
      view: vi.fn()
    }

    await marinePlanPolicySubmitController.handler(
      {
        params: { policyCode: 'SW-BIO-1' },
        payload: {
          policyConsideration: 'My considered answer',
          documentationCheck: 'requiresDocumentation'
        }
      },
      h
    )

    expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      '/marine-licence/marine-plan-policy-response',
      expect.objectContaining({ requiresDocumentation: true })
    )
  })

  test('redirects to check your answers when returnTo is set', async () => {
    const h = {
      redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
      view: vi.fn()
    }

    await marinePlanPolicySubmitController.handler(
      {
        params: { policyCode: 'SW-BIO-1' },
        payload: { policyConsideration: 'My considered answer' },
        yar: {
          get: vi
            .fn()
            .mockReturnValue(
              marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
            )
        }
      },
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(cyaReturnLink('other'))
  })

  test('failAction preserves the check your answers return link', async () => {
    const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
    const err = {
      details: [
        {
          path: ['policyConsideration'],
          message: errorMessages.POLICY_CONSIDERATION_REQUIRED,
          type: 'any.required'
        }
      ]
    }

    await marinePlanPolicySubmitController.options.validate.failAction(
      {
        params: { policyCode: 'SW-BIO-1' },
        payload: { policyConsideration: '' },
        yar: {
          get: vi
            .fn()
            .mockReturnValue(
              marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
            )
        }
      },
      h,
      err
    )

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_VIEW_ROUTE,
      expect.objectContaining({ backLink: cyaReturnLink('other') })
    )
    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('throws 404 and does not save when the policy code is unknown', async () => {
    const h = {
      redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
      view: vi.fn()
    }

    await expect(
      marinePlanPolicySubmitController.handler(
        {
          params: { policyCode: 'UNKNOWN-1' },
          payload: { policyConsideration: 'My considered answer' }
        },
        h
      )
    ).rejects.toMatchObject({ output: { statusCode: 404 } })
    expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
    expect(h.redirect).not.toHaveBeenCalled()
  })

  test.each([
    { name: 'null error details', err: { details: null } },
    { name: 'missing error details', err: {} }
  ])('failAction with $name re-renders without error data', async ({ err }) => {
    const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

    await marinePlanPolicySubmitController.options.validate.failAction(
      {
        params: { policyCode: 'SW-BIO-1' },
        payload: { policyConsideration: 'partial answer' }
      },
      h,
      err
    )

    const model = h.view.mock.calls[0][1]
    expect(model).toEqual(
      expect.objectContaining({
        heading: 'SW-BIO-1',
        payload: { policyConsideration: 'partial answer' }
      })
    )
    expect(model.errors).toBeUndefined()
    expect(model.errorSummary).toBeUndefined()
    expect(h.view().takeover).toHaveBeenCalled()
  })
})
