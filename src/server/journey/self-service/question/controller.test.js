import { describe, it, expect, beforeEach, vi } from 'vitest'
import { questionController, questionPostController } from './controller.js'
import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: { patch: vi.fn() }
}))

const SLUG = 'abcdefghijklmnopqrstuv'

function makeRequest({
  answers = [],
  payload = {},
  questionRoute = '/activity-type'
} = {}) {
  return {
    params: { slug: SLUG, questionPath: questionRoute.replace(/^\//, '') },
    app: { iatDoc: { slug: SLUG, answers, published: false } },
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

  it('reads request.app.iatDoc.answers (not yar) and renders the question with the matching selectedAnswers', () => {
    const request = makeRequest({
      answers: [
        {
          type: 'question',
          questionRoute: '/activity-type',
          answerIds: ['CON']
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
    // answers log has /activity-type as the previous step; current question is /sea
    const request = makeRequest({
      answers: [
        {
          type: 'question',
          questionRoute: '/activity-type',
          answerIds: ['CON']
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
    iatAnswersService.patch.mockReset().mockResolvedValue(undefined)
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
    expect(iatAnswersService.patch).not.toHaveBeenCalled()
  })

  it('patches the doc with the new answers log and redirects to the slug-prefixed next route', async () => {
    const request = makeRequest({
      answers: [],
      payload: { answer: 'CON' }
    })
    await questionPostController.handler(request, h)
    expect(iatAnswersService.patch).toHaveBeenCalledWith(request, SLUG, {
      answers: [
        {
          type: 'question',
          questionRoute: '/activity-type',
          answerIds: ['CON']
        }
      ]
    })
    // CON on /activity-type has nextQuestionRoute: /exemption/construction (a question route).
    expect(redirect).toHaveBeenCalledWith(
      `/journey/self-service/c/${SLUG}/exemption/construction`
    )
  })

  it('trims future answers when the user re-answers an earlier question', async () => {
    const request = makeRequest({
      answers: [
        {
          type: 'question',
          questionRoute: '/activity-type',
          answerIds: ['DEPOSIT']
        },
        {
          type: 'question',
          questionRoute: '/deposit/method',
          answerIds: ['something']
        }
      ],
      payload: { answer: 'CON' }
    })
    await questionPostController.handler(request, h)
    expect(iatAnswersService.patch).toHaveBeenCalledWith(request, SLUG, {
      answers: [
        {
          type: 'question',
          questionRoute: '/activity-type',
          answerIds: ['CON']
        }
      ]
    })
  })
})
