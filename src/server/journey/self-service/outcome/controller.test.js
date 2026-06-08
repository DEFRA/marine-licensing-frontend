import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  outcomeController,
  outcomePostController,
  outcomeViewAnswersController,
  outcomeContinueController
} from './controller.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'
import { iatOutcomeDocumentService } from '#src/services/iat-service/iat-outcome-document.service.js'
import { routes } from '#src/server/common/constants/routes.js'

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

  it('renders terminal-single WITHOUT recording the outcome in the answer log (matches MCMS)', async () => {
    const request = makeRequest({ outcomeRoute: TERMINAL_SINGLE_ROUTE })
    await outcomeController.handler(request, h)
    expect(view).toHaveBeenCalled()
    expect(iatContextService.patch).not.toHaveBeenCalled()
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

  it('records the chosen outcomeType.text as questionText and outcomeType.heading as the answer (matches MCMS)', async () => {
    const request = makeRequest({
      outcomeRoute: INTERMEDIATE_ROUTE,
      payload: { outcomeType: INTERMEDIATE_TYPE_ID }
    })
    await outcomePostController.handler(request, h)
    const payload = iatContextService.patch.mock.calls[0][2]
    expect(payload.questionText).toMatch(
      /Based on the information provided the selected activity is a licensable activity/
    )
    expect(payload.answers[0].text).toBe(
      'Check to see if an exemption applies or notify the MMO about an exempt activity'
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
    iatOutcomeDocumentService.mint.mockReset()
    redirect = vi.fn()
    h = { redirect }
  })

  it('mints an outcome document and redirects to the outcome-document page', async () => {
    const newSlug = 'B'.repeat(22)
    iatOutcomeDocumentService.mint.mockResolvedValue({
      slug: newSlug,
      viewUrl: routes.OUTCOME_DOCUMENT.replace('{slug}', newSlug),
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
    expect(redirect).toHaveBeenCalledWith(
      routes.OUTCOME_DOCUMENT.replace('{slug}', newSlug)
    )
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

  it('throws Boom.badImplementation when the mint service returns no slug', async () => {
    iatOutcomeDocumentService.mint.mockResolvedValue({ slug: undefined })
    const request = makeRequest({
      outcomeRoute: TERMINAL_MULTI_ROUTE,
      params: { outcomeTypeId: TERMINAL_MULTI_TYPE_ID }
    })
    await expect(
      outcomeViewAnswersController.handler(request, h)
    ).rejects.toThrow(/mint returned no slug/)
    expect(redirect).not.toHaveBeenCalled()
  })
})

describe('outcomeContinueController', () => {
  const EXEMPTION_ROUTE =
    '/exemption/licence-not-required-exemption-available-article-13'
  const EXEMPTION_TYPE_ID = 'WO_EXE_AVAILABLE_ARTICLE_13'
  const OVERRIDE_URL =
    'https://get-permission-for-marine-work.defra.gov.uk/guidance/who-is-the-exemption-for/'

  let redirect, h

  beforeEach(() => {
    iatOutcomeDocumentService.mint.mockReset()
    redirect = vi.fn()
    h = { redirect }
  })

  function continueRequest(outcomeRoute, outcomeTypeId, questionLog = []) {
    return {
      params: {
        slug: SLUG,
        outcomeTypeId,
        outcomePath: outcomeRoute.replace(/^\//, '')
      },
      app: { iatDoc: { slug: SLUG, questionLog } },
      logger: { warn: vi.fn() }
    }
  }

  it('mints, builds the query string, and 302s to overrideCtaButtonUrl', async () => {
    iatOutcomeDocumentService.mint.mockResolvedValue({
      slug: 'B'.repeat(22),
      answersUrl: `https://fe.example/outcome-documents/${'B'.repeat(22)}`
    })
    const request = continueRequest(EXEMPTION_ROUTE, EXEMPTION_TYPE_ID, [
      {
        questionRoute: '/activity-type',
        answers: [{ id: 'CON', text: 'Construction' }],
        mcmsAppFormMapping: 'ACTIVITY_TYPE'
      }
    ])

    await outcomeContinueController.handler(request, h)

    expect(iatOutcomeDocumentService.mint).toHaveBeenCalledTimes(1)
    const location = redirect.mock.calls[0][0]
    expect(location).toContain('/guidance/who-is-the-exemption-for/?')
    expect(location).not.toContain(new URL(OVERRIDE_URL).host)
    expect(location).toContain('ACTIVITY_TYPE=CON')
    expect(location).toContain('ADV_TYPE=EXE')
    expect(location).toContain('ARTICLE=13')
    expect(location).toContain(
      `pdfDownloadUrl=https%3A%2F%2Ffe.example%2Foutcome-documents%2F${'B'.repeat(22)}`
    )
  })

  it('404s for a non-exemption outcomeType (no overrideCtaButtonUrl) without minting', async () => {
    const request = continueRequest(
      '/exemption/licence-required-no-exemption',
      'WO_EXE_LICENCE_REQUIRED'
    )
    await expect(
      outcomeContinueController.handler(request, h)
    ).rejects.toMatchObject({ output: { statusCode: 404 } })
    expect(iatOutcomeDocumentService.mint).not.toHaveBeenCalled()
  })

  it('400s for an outcomeTypeId that does not belong to the outcome', async () => {
    const request = continueRequest(EXEMPTION_ROUTE, 'WO_NOT_A_REAL_TYPE')
    await expect(
      outcomeContinueController.handler(request, h)
    ).rejects.toMatchObject({ output: { statusCode: 400 } })
    expect(iatOutcomeDocumentService.mint).not.toHaveBeenCalled()
  })
})
