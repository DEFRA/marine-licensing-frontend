import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  outcomeController,
  outcomePostController,
  outcomeViewAnswersController
} from './controller.js'
import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: { patch: vi.fn(), publish: vi.fn() }
}))

// Real intermediate outcome: /construction/journey-select
// outcomeType with nextQuestionRoute: WO_CON_EXEMPTION_JOURNEY -> /exemption/construction
const INTERMEDIATE_ROUTE = '/construction/journey-select'
const INTERMEDIATE_TYPE_ID = 'WO_CON_EXEMPTION_JOURNEY'

// Real terminal-single outcome: /exemption/licence-required-no-exemption
// outcomeType: WO_EXE_LICENCE_REQUIRED (no nextQuestionRoute)
const TERMINAL_SINGLE_ROUTE = '/exemption/licence-required-no-exemption'

// Real terminal-multi outcome: /mod-permission
// outcomeTypes: WO_MOD_PERMISSION, WO_STANDARD_TRACK_MLA
const TERMINAL_MULTI_ROUTE = '/mod-permission'
const TERMINAL_MULTI_TYPE_ID = 'WO_MOD_PERMISSION'

const SLUG = 'abcdefghijklmnopqrstuv'

function makeRequest({ outcomeRoute, answers = [], payload = {}, params = {} } = {}) {
  return {
    params: { slug: SLUG, outcomePath: outcomeRoute.replace(/^\//, ''), ...params },
    app: { iatDoc: { slug: SLUG, answers, published: false } },
    payload,
    logger: { warn: vi.fn() }
  }
}

describe('outcomeController GET', () => {
  let view, redirect, h

  beforeEach(() => {
    iatAnswersService.patch.mockReset().mockResolvedValue(undefined)
    view = vi.fn()
    redirect = vi.fn()
    h = { view, redirect }
  })

  it('renders without patching when classification is intermediate', async () => {
    const request = makeRequest({ outcomeRoute: INTERMEDIATE_ROUTE })
    await outcomeController.handler(request, h)
    expect(view).toHaveBeenCalled()
    expect(iatAnswersService.patch).not.toHaveBeenCalled()
  })

  it('pushes the chosen outcomeTypeId and patches the doc on terminal-single', async () => {
    const request = makeRequest({ outcomeRoute: TERMINAL_SINGLE_ROUTE })
    await outcomeController.handler(request, h)
    expect(iatAnswersService.patch).toHaveBeenCalledWith(
      request,
      SLUG,
      expect.objectContaining({
        answers: expect.arrayContaining([
          expect.objectContaining({
            type: 'outcome',
            outcomeRoute: TERMINAL_SINGLE_ROUTE,
            outcomeTypeId: expect.any(String)
          })
        ])
      })
    )
    expect(view).toHaveBeenCalled()
  })
})

describe('outcomePostController (intermediate)', () => {
  let redirect, h

  beforeEach(() => {
    iatAnswersService.patch.mockReset().mockResolvedValue(undefined)
    redirect = vi.fn()
    h = { redirect }
  })

  it('patches with the selected outcomeTypeId and redirects to slug-prefixed next route', async () => {
    const request = makeRequest({
      outcomeRoute: INTERMEDIATE_ROUTE,
      payload: { outcomeType: INTERMEDIATE_TYPE_ID }
    })
    await outcomePostController.handler(request, h)
    expect(iatAnswersService.patch).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^/journey/self-service/c/${SLUG}/`))
    )
  })

  it('throws Boom.badRequest if outcomeType is not a valid choice on this outcome', async () => {
    const request = makeRequest({
      outcomeRoute: INTERMEDIATE_ROUTE,
      payload: { outcomeType: 'NOT_A_REAL_TYPE' }
    })
    await expect(outcomePostController.handler(request, h)).rejects.toThrow(/Invalid outcome selection/)
  })
})

describe('outcomeViewAnswersController', () => {
  let redirect, h

  beforeEach(() => {
    iatAnswersService.patch.mockReset().mockResolvedValue(undefined)
    iatAnswersService.publish.mockReset().mockResolvedValue(undefined)
    redirect = vi.fn()
    h = { redirect }
  })

  it('patches the chosen outcomeTypeId, publishes, then redirects to /iat-answer/{slug}', async () => {
    const request = makeRequest({
      outcomeRoute: TERMINAL_MULTI_ROUTE,
      params: { outcomeTypeId: TERMINAL_MULTI_TYPE_ID }
    })
    await outcomeViewAnswersController.handler(request, h)
    expect(iatAnswersService.patch).toHaveBeenCalled()
    expect(iatAnswersService.publish).toHaveBeenCalledWith(request, SLUG)
    expect(redirect).toHaveBeenCalledWith(`/iat-answer/${SLUG}`)
  })

  it('throws Boom.badRequest if outcomeTypeId is not a valid type on this outcome', async () => {
    const request = makeRequest({
      outcomeRoute: TERMINAL_SINGLE_ROUTE,
      params: { outcomeTypeId: 'NOT_A_REAL_TYPE' }
    })
    await expect(outcomeViewAnswersController.handler(request, h)).rejects.toThrow(/Invalid outcome selection/)
    expect(iatAnswersService.publish).not.toHaveBeenCalled()
  })
})
