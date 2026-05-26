import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  outcomeController,
  outcomePostController,
  outcomeViewAnswersController
} from './controller.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'
import { iatOutcomeDocumentService } from '#src/services/iat-service/iat-outcome-document.service.js'

vi.mock('#src/services/iat-service/iat-context.service.js', () => ({
  iatContextService: { patch: vi.fn() }
}))
vi.mock('#src/services/iat-service/iat-outcome-document.service.js', () => ({
  iatOutcomeDocumentService: { mint: vi.fn() }
}))

// Real intermediate outcome: /construction/journey-select
// outcomeType with nextQuestionRoute: WO_CON_EXEMPTION_JOURNEY -> /exemption/construction
const INTERMEDIATE_ROUTE = '/construction/journey-select'
const INTERMEDIATE_TYPE_ID = 'WO_CON_EXEMPTION_JOURNEY'

// Real terminal-single outcome: /exemption/licence-required-no-exemption
// outcomeType: WO_EXE_LICENCE_REQUIRED (no nextQuestionRoute)
const TERMINAL_SINGLE_ROUTE = '/exemption/licence-required-no-exemption'
const TERMINAL_SINGLE_TYPE_ID = 'WO_EXE_LICENCE_REQUIRED'

// Real terminal-multi outcome: /mod-permission
// outcomeTypes: WO_MOD_PERMISSION, WO_STANDARD_TRACK_MLA
const TERMINAL_MULTI_ROUTE = '/mod-permission'
const TERMINAL_MULTI_TYPE_ID = 'WO_MOD_PERMISSION'

const SLUG = 'abcdefghijklmnopqrstuv'

function makeRequest({
  outcomeRoute,
  questionLog = [],
  payload = {},
  params = {}
} = {}) {
  return {
    params: {
      slug: SLUG,
      outcomePath: outcomeRoute.replace(/^\//, ''),
      ...params
    },
    app: { iatDoc: { slug: SLUG, questionLog } },
    payload,
    logger: { warn: vi.fn() }
  }
}

describe('outcomeController GET', () => {
  let view, redirect, h

  beforeEach(() => {
    iatContextService.patch.mockReset().mockResolvedValue(undefined)
    view = vi.fn()
    redirect = vi.fn()
    h = { view, redirect }
  })

  it('renders without patching when classification is intermediate', async () => {
    const request = makeRequest({ outcomeRoute: INTERMEDIATE_ROUTE })
    await outcomeController.handler(request, h)
    expect(view).toHaveBeenCalled()
    expect(iatContextService.patch).not.toHaveBeenCalled()
  })

  it('patches the doc with the chosen outcomeType as an answer on terminal-single', async () => {
    const request = makeRequest({ outcomeRoute: TERMINAL_SINGLE_ROUTE })
    await outcomeController.handler(request, h)
    expect(iatContextService.patch).toHaveBeenCalledWith(
      request,
      SLUG,
      expect.objectContaining({
        questionRoute: TERMINAL_SINGLE_ROUTE,
        answers: [expect.objectContaining({ id: TERMINAL_SINGLE_TYPE_ID })]
      })
    )
    expect(view).toHaveBeenCalled()
  })
})

describe('outcomePostController (intermediate)', () => {
  let redirect, h

  beforeEach(() => {
    iatContextService.patch.mockReset().mockResolvedValue(undefined)
    redirect = vi.fn()
    h = { redirect }
  })

  it('patches with the selected outcomeType as an answer and redirects to slug-prefixed next route', async () => {
    const request = makeRequest({
      outcomeRoute: INTERMEDIATE_ROUTE,
      payload: { outcomeType: INTERMEDIATE_TYPE_ID }
    })
    await outcomePostController.handler(request, h)
    expect(iatContextService.patch).toHaveBeenCalledWith(
      request,
      SLUG,
      expect.objectContaining({
        questionRoute: INTERMEDIATE_ROUTE,
        answers: [expect.objectContaining({ id: INTERMEDIATE_TYPE_ID })]
      })
    )
    expect(redirect).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^/journey/self-service/c/${SLUG}/`))
    )
  })

  it('throws Boom.badRequest if outcomeType is not a valid choice on this outcome', async () => {
    const request = makeRequest({
      outcomeRoute: INTERMEDIATE_ROUTE,
      payload: { outcomeType: 'NOT_A_REAL_TYPE' }
    })
    await expect(outcomePostController.handler(request, h)).rejects.toThrow(
      /Invalid outcome selection/
    )
  })
})

describe('outcomeViewAnswersController', () => {
  let redirect, h

  beforeEach(() => {
    iatContextService.patch.mockReset().mockResolvedValue(undefined)
    iatOutcomeDocumentService.mint.mockReset()
    redirect = vi.fn()
    h = { redirect }
  })

  it('mints an outcome document and redirects to /outcome-documents/{newSlug}', async () => {
    const newSlug = 'B'.repeat(22)
    iatOutcomeDocumentService.mint.mockResolvedValue({
      slug: newSlug,
      viewUrl: `/outcome-documents/${newSlug}`,
      snapshot: {}
    })

    const request = makeRequest({
      outcomeRoute: TERMINAL_MULTI_ROUTE,
      params: { outcomeTypeId: TERMINAL_MULTI_TYPE_ID }
    })
    await outcomeViewAnswersController.handler(request, h)
    expect(iatOutcomeDocumentService.mint).toHaveBeenCalledWith(
      request,
      SLUG,
      expect.objectContaining({
        outcomeRoute: TERMINAL_MULTI_ROUTE,
        focusedOption: expect.objectContaining({ id: TERMINAL_MULTI_TYPE_ID })
      })
    )
    expect(redirect).toHaveBeenCalledWith(`/outcome-documents/${newSlug}`)
  })

  it('throws Boom.badRequest if outcomeTypeId is not a valid type on this outcome', async () => {
    const request = makeRequest({
      outcomeRoute: TERMINAL_SINGLE_ROUTE,
      params: { outcomeTypeId: 'NOT_A_REAL_TYPE' }
    })
    await expect(
      outcomeViewAnswersController.handler(request, h)
    ).rejects.toThrow(/Invalid outcome selection/)
    expect(iatOutcomeDocumentService.mint).not.toHaveBeenCalled()
  })
})
