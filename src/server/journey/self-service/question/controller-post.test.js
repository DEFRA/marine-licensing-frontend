import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

vi.mock('#src/server/journey/self-service/services/journey-data.js')
vi.mock('#src/server/journey/self-service/services/journey-router.js')
vi.mock('#src/server/journey/self-service/services/session-answers.js')

import { questionPostController } from '#src/server/journey/self-service/question/controller-post.js'
import {
  getQuestion,
  getSection
} from '#src/server/journey/self-service/services/journey-data.js'
import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'
import {
  pushAnswer,
  getBackLink
} from '#src/server/journey/self-service/services/session-answers.js'

describe('#questionPostController', () => {
  const mockQuestion = {
    route: '/sea',
    text: 'Where will the activity take place?',
    section: 'doINeedAMarineLicence',
    answers: [
      {
        id: 'inSea',
        text: 'In or over the sea',
        nextQuestionRoute: '/jurisdiction'
      },
      {
        id: 'construction',
        text: 'Construction',
        outcomeRoute: '/construction/journey-select'
      },
      { id: 'other', text: 'Somewhere else', outcomeRoute: '/not-licensable' }
    ]
  }

  const mockSection = {
    id: 'doINeedAMarineLicence',
    text: 'Jurisdiction check'
  }

  beforeEach(() => {
    vi.mocked(getQuestion).mockReturnValue(mockQuestion)
    vi.mocked(getSection).mockReturnValue(mockSection)
    vi.mocked(pushAnswer).mockReturnValue(undefined)
    vi.mocked(getBackLink).mockReturnValue('/journey/self-service/start')
  })

  test('redirects to the next question on valid answer', () => {
    vi.mocked(calculateNextRoute).mockReturnValue({
      type: 'question',
      route: '/jurisdiction'
    })

    const request = {
      params: { questionPath: 'sea' },
      payload: { answer: 'inSea' }
    }
    const h = { redirect: vi.fn() }

    questionPostController.handler(request, h)

    expect(pushAnswer).toHaveBeenCalledWith(request, '/sea', ['inSea'])
    expect(h.redirect).toHaveBeenCalledWith(
      '/journey/self-service/jurisdiction'
    )
  })

  test('redirects with /outcome/ prefix when answer leads to an outcome', () => {
    vi.mocked(calculateNextRoute).mockReturnValue({
      type: 'outcome',
      route: '/construction/journey-select'
    })

    const request = {
      params: { questionPath: 'sea' },
      payload: { answer: 'construction' }
    }
    const h = { redirect: vi.fn() }

    questionPostController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      '/journey/self-service/outcome/construction/journey-select'
    )
  })

  test('returns 400 with error when no answer is selected', () => {
    const request = {
      params: { questionPath: 'sea' },
      payload: {}
    }
    const codeStub = vi.fn()
    const h = { view: vi.fn().mockReturnValue({ code: codeStub }) }

    questionPostController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/question/index',
      expect.objectContaining({
        errors: { answer: { text: 'Select an option' } },
        errorSummary: [{ text: 'Select an option', href: '#answer' }],
        selectedAnswers: []
      })
    )
    expect(getBackLink).toHaveBeenCalledWith(request, '/sea', 'question')
    expect(codeStub).toHaveBeenCalledWith(statusCodes.badRequest)
  })

  test('returns 400 with error when payload is null', () => {
    const request = {
      params: { questionPath: 'sea' },
      payload: null
    }
    const codeStub = vi.fn()
    const h = { view: vi.fn().mockReturnValue({ code: codeStub }) }

    questionPostController.handler(request, h)

    expect(codeStub).toHaveBeenCalledWith(statusCodes.badRequest)
  })

  test('throws Boom.notFound when question is not found', () => {
    vi.mocked(getQuestion).mockReturnValue(null)
    const request = {
      params: { questionPath: 'nonexistent' },
      payload: { answer: 'anything' }
    }
    const h = { view: vi.fn() }

    expect(() => questionPostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 404 })
      })
    )
  })

  describe('multi-select POST', () => {
    const multiSelectQuestion = {
      route: '/construction/maintenance-existing-works',
      text: 'Sub-activities',
      section: 'subactivityType',
      multiSelect: {
        questionRoute: '/construction/maintenance-existing-works/scaffolding',
        outcomeRoute: '/standard-marine-licence-application/other-maintenance',
        outcomeAnswerId: 'OTHER_MAINTENANCE'
      },
      answers: [
        { id: 'SCAFFOLDING_ACCESS_TOWERS' },
        { id: 'OTHER_MAINTENANCE' }
      ]
    }

    beforeEach(() => {
      vi.mocked(getQuestion).mockReturnValue(multiSelectQuestion)
      vi.mocked(getSection).mockReturnValue({
        id: 'subactivityType',
        text: 'Sub-activities'
      })
    })

    test('returns 400 with multi-select error message when answers is empty', () => {
      const request = {
        params: { questionPath: 'construction/maintenance-existing-works' },
        payload: {}
      }
      const codeStub = vi.fn()
      const h = { view: vi.fn().mockReturnValue({ code: codeStub }) }

      questionPostController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'journey/self-service/question/index',
        expect.objectContaining({
          errors: { answers: { text: 'Select at least one option' } },
          errorSummary: [
            { text: 'Select at least one option', href: '#answers' }
          ]
        })
      )
      expect(codeStub).toHaveBeenCalledWith(statusCodes.badRequest)
    })

    test('coerces a single answers string into a one-element array and pushes it', () => {
      vi.mocked(calculateNextRoute).mockReturnValue({
        type: 'question',
        route: '/construction/maintenance-existing-works/scaffolding'
      })
      const request = {
        params: { questionPath: 'construction/maintenance-existing-works' },
        payload: { answers: 'SCAFFOLDING_ACCESS_TOWERS' }
      }
      const h = { redirect: vi.fn() }

      questionPostController.handler(request, h)

      expect(pushAnswer).toHaveBeenCalledWith(
        request,
        '/construction/maintenance-existing-works',
        ['SCAFFOLDING_ACCESS_TOWERS']
      )
    })

    test('passes the full answers array to calculateNextRoute', () => {
      vi.mocked(calculateNextRoute).mockReturnValue({
        type: 'outcome',
        route: '/standard-marine-licence-application/other-maintenance'
      })
      const request = {
        params: { questionPath: 'construction/maintenance-existing-works' },
        payload: {
          answers: ['SCAFFOLDING_ACCESS_TOWERS', 'OTHER_MAINTENANCE']
        }
      }
      const h = { redirect: vi.fn() }

      questionPostController.handler(request, h)

      expect(calculateNextRoute).toHaveBeenCalledWith(multiSelectQuestion, [
        'SCAFFOLDING_ACCESS_TOWERS',
        'OTHER_MAINTENANCE'
      ])
    })
  })
})
