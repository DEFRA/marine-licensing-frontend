// Covers defensive runtime-issue branches in outcome/controller.js:
// empty resolvable outcomeTypes, missing outcome heading, missing
// outcomeType text. Lives in its own file because the journey-data
// auto-mock used here would break the real-JSON-based tests in
// controller.test.js.

import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js')
vi.mock('#src/server/journey/self-service/services/data-quality.js')
vi.mock('#src/services/iat-service/iat-context.service.js', () => ({
  iatContextService: { patch: vi.fn() }
}))
vi.mock('#src/services/iat-service/iat-outcome-document.service.js', () => ({
  iatOutcomeDocumentService: { mint: vi.fn() }
}))

import {
  outcomeController,
  outcomePostController,
  outcomeViewAnswersController
} from './controller.js'
import {
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome,
  isIntermediateOutcome
} from '#src/server/journey/self-service/services/journey-data.js'
import { reportRuntimeIssue } from '#src/server/journey/self-service/services/data-quality.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'

const SLUG = 'abcdefghijklmnopqrstuv'

function makeRequest(outcomeRoute) {
  // outcomeRouteFromRequest prepends '/' to request.params.outcomePath
  return {
    params: { slug: SLUG, outcomePath: outcomeRoute.replace(/^\//, '') },
    app: { iatDoc: { slug: SLUG, questionLog: [] } },
    logger: { warn: vi.fn(), error: vi.fn() }
  }
}

describe('outcomeController GET — defensive runtime-issue branches', () => {
  let view, h

  beforeEach(() => {
    vi.mocked(getOutcome).mockReset()
    vi.mocked(getOutcomeTypesForOutcome).mockReset()
    vi.mocked(isIntermediateOutcome).mockReset()
    vi.mocked(reportRuntimeIssue).mockReset()
    view = vi.fn()
    h = { view }
  })

  it('throws Boom.notFound and reports a runtime issue when the outcome resolves to zero outcomeTypes', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      heading: 'h',
      outcomeTypes: ['UNKNOWN_ID']
    })
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([])

    const request = makeRequest('/orphaned-outcome')
    await expect(outcomeController.handler(request, h)).rejects.toThrow(
      /Outcome has no resolvable outcomeTypes/
    )
    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'outcome-empty-outcome-types',
      '/orphaned-outcome',
      expect.any(String),
      expect.any(String)
    )
  })

  it('reports a runtime issue and falls back to "Result" when the outcome has no heading', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      outcomeTypes: ['X']
    })
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'X', text: 'body', module: 'M' }
    ])
    vi.mocked(isIntermediateOutcome).mockReturnValue(false)

    const request = makeRequest('/no-heading')
    await outcomeController.handler(request, h)

    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'outcome-missing-heading',
      '/no-heading',
      expect.any(String),
      expect.any(String)
    )
    const [, model] = view.mock.calls[0]
    expect(model.heading).toBe('Result')
  })

  it('reports a runtime issue when the focused terminal outcomeType has no text', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      heading: 'h',
      outcomeTypes: ['X']
    })
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'X', text: '', heading: 'opt', module: 'M' }
    ])
    vi.mocked(isIntermediateOutcome).mockReturnValue(false)

    const request = makeRequest('/empty-text')
    await outcomeController.handler(request, h)

    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'outcome-type-empty-text',
      'X',
      expect.any(String),
      expect.any(String)
    )
  })
})

describe('outcomeController GET — buildOutcomeAnswerPayload questionText fallback chain', () => {
  let view, redirect, h

  beforeEach(() => {
    vi.mocked(getOutcome).mockReset()
    vi.mocked(getOutcomeType).mockReset()
    vi.mocked(getOutcomeTypesForOutcome).mockReset()
    vi.mocked(isIntermediateOutcome).mockReset()
    vi.mocked(reportRuntimeIssue).mockReset()
    vi.mocked(iatContextService.patch).mockReset().mockResolvedValue(undefined)
    view = vi.fn()
    redirect = vi.fn()
    h = { view, redirect }
  })

  it('uses outcome.heading as questionText when outcomeType.text is empty (POST)', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      heading: 'Outcome Heading',
      text: 'Outcome Text',
      outcomeTypes: ['OT_ID']
    })
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      {
        id: 'OT_ID',
        text: '',
        heading: 'opt',
        nextQuestionRoute: '/next'
      }
    ])
    vi.mocked(getOutcomeType).mockReturnValue({
      id: 'OT_ID',
      text: '',
      heading: 'opt',
      nextQuestionRoute: '/next'
    })
    vi.mocked(isIntermediateOutcome).mockReturnValue(true)

    const request = {
      params: { slug: SLUG, outcomePath: 'r' },
      payload: { outcomeType: 'OT_ID' },
      app: { iatDoc: { slug: SLUG, questionLog: [] } },
      logger: { warn: vi.fn() }
    }
    await outcomePostController.handler(request, h)
    const patched = vi.mocked(iatContextService.patch).mock.calls[0][2]
    expect(patched.questionText).toBe('Outcome Heading')
  })

  it('uses outcome.text as questionText when both outcomeType.text and outcome.heading are empty (POST)', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      heading: '',
      text: 'Outcome Text',
      outcomeTypes: ['OT_ID']
    })
    vi.mocked(getOutcomeType).mockReturnValue({
      id: 'OT_ID',
      text: '',
      heading: 'opt',
      nextQuestionRoute: '/next'
    })
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      {
        id: 'OT_ID',
        text: '',
        heading: 'opt',
        nextQuestionRoute: '/next'
      }
    ])
    vi.mocked(isIntermediateOutcome).mockReturnValue(true)

    const request = {
      params: { slug: SLUG, outcomePath: 'r' },
      payload: { outcomeType: 'OT_ID' },
      app: { iatDoc: { slug: SLUG, questionLog: [] } },
      logger: { warn: vi.fn() }
    }
    await outcomePostController.handler(request, h)
    const patched = vi.mocked(iatContextService.patch).mock.calls[0][2]
    expect(patched.questionText).toBe('Outcome Text')
  })

  it('falls back to outcomeType.id as answer text when outcomeType.heading is missing (POST)', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      heading: 'h',
      text: 'body',
      outcomeTypes: ['OT_ID']
    })
    vi.mocked(getOutcomeType).mockReturnValue({
      id: 'OT_ID',
      text: 'ot text',
      // heading deliberately undefined
      nextQuestionRoute: '/next'
    })
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'OT_ID', text: 'ot text', nextQuestionRoute: '/next' }
    ])
    vi.mocked(isIntermediateOutcome).mockReturnValue(true)

    const request = {
      params: { slug: SLUG, outcomePath: 'r' },
      payload: { outcomeType: 'OT_ID' },
      app: { iatDoc: { slug: SLUG, questionLog: [] } },
      logger: { warn: vi.fn() }
    }
    await outcomePostController.handler(request, h)
    const patched = vi.mocked(iatContextService.patch).mock.calls[0][2]
    expect(patched.answers[0].text).toBe('OT_ID')
  })

  it('falls back to outcomeRoute as questionText when text+heading+text are all empty (POST)', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      heading: '',
      text: '',
      outcomeTypes: ['OT_ID']
    })
    vi.mocked(getOutcomeType).mockReturnValue({
      id: 'OT_ID',
      text: '',
      heading: 'opt',
      nextQuestionRoute: '/next'
    })
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      {
        id: 'OT_ID',
        text: '',
        heading: 'opt',
        nextQuestionRoute: '/next'
      }
    ])
    vi.mocked(isIntermediateOutcome).mockReturnValue(true)

    const request = {
      params: { slug: SLUG, outcomePath: 'orphan-text' },
      payload: { outcomeType: 'OT_ID' },
      app: { iatDoc: { slug: SLUG, questionLog: [] } },
      logger: { warn: vi.fn() }
    }
    await outcomePostController.handler(request, h)
    const patched = vi.mocked(iatContextService.patch).mock.calls[0][2]
    expect(patched.questionText).toBe('/orphan-text')
  })
})

describe('outcomePostController + outcomeViewAnswersController — outcomeTypeId-absent ternary branches', () => {
  let redirect, h

  beforeEach(() => {
    vi.mocked(getOutcome).mockReset()
    vi.mocked(getOutcomeType).mockReset()
    vi.mocked(getOutcomeTypesForOutcome).mockReset()
    vi.mocked(isIntermediateOutcome).mockReset()
    vi.mocked(reportRuntimeIssue).mockReset()
    redirect = vi.fn()
    h = { redirect }
  })

  it('outcomePostController throws Boom.badRequest when payload has no outcomeType (covers ternary fallback)', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      heading: 'h',
      outcomeTypes: ['X']
    })
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'X', nextQuestionRoute: '/next' }
    ])
    vi.mocked(isIntermediateOutcome).mockReturnValue(true)

    const request = {
      params: { slug: SLUG, outcomePath: 'r' },
      payload: {},
      app: { iatDoc: { slug: SLUG, questionLog: [] } },
      logger: { warn: vi.fn() }
    }
    await expect(outcomePostController.handler(request, h)).rejects.toThrow(
      /Invalid outcome selection/
    )
    expect(vi.mocked(getOutcomeType)).not.toHaveBeenCalled()
  })

  it('outcomeViewAnswersController throws Boom.badRequest when params has no outcomeTypeId (covers ternary fallback)', async () => {
    vi.mocked(getOutcome).mockReturnValue({
      heading: 'h',
      outcomeTypes: ['X']
    })

    const request = {
      params: { slug: SLUG, outcomePath: 'r' },
      app: { iatDoc: { slug: SLUG, questionLog: [] } },
      logger: { warn: vi.fn() }
    }
    await expect(
      outcomeViewAnswersController.handler(request, h)
    ).rejects.toThrow(/Invalid outcome selection/)
    expect(vi.mocked(getOutcomeType)).not.toHaveBeenCalled()
  })
})
