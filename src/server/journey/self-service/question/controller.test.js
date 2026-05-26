import { describe, it, expect, beforeEach, vi } from 'vitest'
import { questionController, questionPostController } from './controller.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

vi.mock('#src/services/iat-service/iat-context.service.js', () => ({
  iatContextService: { patch: vi.fn() }
}))

const SLUG = 'abcdefghijklmnopqrstuv'

function makeRequest({
  questionLog = [],
  payload = {},
  questionRoute = '/activity-type'
} = {}) {
  return {
    params: { slug: SLUG, questionPath: questionRoute.replace(/^\//, '') },
    app: { iatDoc: { slug: SLUG, questionLog } },
    payload,
    logger: { warn: vi.fn() }
  }
}

describe('questionController GET', () => {
  let view, code, h

  beforeEach(() => {
    code = vi.fn()
    view = vi.fn(() => ({ code }))
    h = { view }
  })

  it('reads request.app.iatDoc.questionLog (not yar) and renders the question with the matching selectedAnswers', () => {
    const request = makeRequest({
      questionLog: [
        {
          questionRoute: '/activity-type',
          questionText: 'What kind?',
          answers: [{ id: 'CON', text: 'Construction' }]
        }
      ]
    })
    questionController.handler(request, h)
    expect(view).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ selectedAnswers: ['CON'] })
    )
  })

  it('builds backLink under the slug-prefixed URL', () => {
    // questionLog has /activity-type as the previous step; current question is /sea
    const request = makeRequest({
      questionLog: [
        {
          questionRoute: '/activity-type',
          questionText: 'What kind?',
          answers: [{ id: 'CON', text: 'Construction' }]
        }
      ],
      questionRoute: '/sea'
    })
    questionController.handler(request, h)
    expect(view).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        backLink: `/journey/self-service/c/${SLUG}/activity-type`
      })
    )
  })
})

describe('questionPostController', () => {
  let view, code, redirect, h

  beforeEach(() => {
    iatContextService.patch.mockReset().mockResolvedValue(undefined)
    code = vi.fn()
    view = vi.fn(() => ({ code }))
    redirect = vi.fn()
    h = { view, redirect }
  })

  it('renders the question with an error and 400 status when no answer submitted', async () => {
    const request = makeRequest({ payload: {} })
    await questionPostController.handler(request, h)
    expect(view).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        errors: expect.any(Object),
        selectedAnswers: []
      })
    )
    expect(code).toHaveBeenCalledWith(statusCodes.badRequest)
    expect(iatContextService.patch).not.toHaveBeenCalled()
  })

  it('patches the doc with the new answer and redirects to the slug-prefixed next route', async () => {
    const request = makeRequest({
      questionLog: [],
      payload: { answer: 'CON' }
    })
    await questionPostController.handler(request, h)
    expect(iatContextService.patch).toHaveBeenCalledWith(
      request,
      SLUG,
      expect.objectContaining({
        questionRoute: '/activity-type',
        answers: [{ id: 'CON', text: 'Construction' }]
      })
    )
    // CON on /activity-type has nextQuestionRoute: /exemption/construction (a question route).
    expect(redirect).toHaveBeenCalledWith(
      `/journey/self-service/c/${SLUG}/exemption/construction`
    )
  })

  it('passes a single answer per PATCH call (backend handles append/truncate)', async () => {
    const request = makeRequest({
      questionLog: [
        {
          questionRoute: '/activity-type',
          questionText: 'What kind?',
          answers: [{ id: 'DEPOSIT', text: 'Deposit' }]
        },
        {
          questionRoute: '/deposit/method',
          questionText: 'Method?',
          answers: [{ id: 'something', text: 'Something' }]
        }
      ],
      payload: { answer: 'CON' }
    })
    await questionPostController.handler(request, h)
    expect(iatContextService.patch).toHaveBeenCalledTimes(1)
    const callArg = iatContextService.patch.mock.calls[0][2]
    expect(callArg.questionRoute).toBe('/activity-type')
    expect(callArg.answers).toEqual([{ id: 'CON', text: 'Construction' }])
  })
})
