import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

vi.mock('#src/server/journey/self-service/services/journey-data.js')
vi.mock('#src/server/journey/self-service/services/journey-router.js')
vi.mock('#src/server/journey/self-service/services/session-answers.js')
vi.mock('#src/server/journey/self-service/services/data-quality.js')

import {
  questionController,
  questionPostController
} from '#src/server/journey/self-service/question/controller.js'
import {
  getQuestion,
  getSection
} from '#src/server/journey/self-service/services/journey-data.js'
import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'
import {
  getBackLink,
  getAnswerForRoute,
  pushAnswer
} from '#src/server/journey/self-service/services/session-answers.js'
import {
  reportRuntimeIssue,
  reportRuntimeError
} from '#src/server/journey/self-service/services/data-quality.js'

describe('#questionController', () => {
  const mockQuestion = {
    route: '/sea',
    text: 'Where will the activity take place?',
    section: 'doINeedAMarineLicence',
    answers: [{ id: 'inSea', text: 'In or over the sea' }]
  }

  const mockSection = {
    id: 'doINeedAMarineLicence',
    text: 'Jurisdiction check'
  }

  beforeEach(() => {
    vi.mocked(getQuestion).mockReturnValue(mockQuestion)
    vi.mocked(getSection).mockReturnValue(mockSection)
    vi.mocked(getBackLink).mockReturnValue('/journey/self-service/start')
    vi.mocked(getAnswerForRoute).mockReturnValue([])
  })

  test('calls h.view with the correct template and view model', () => {
    const request = {
      params: { questionPath: 'sea' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    questionController.handler(request, h)

    expect(getQuestion).toHaveBeenCalledWith('/sea')
    expect(getSection).toHaveBeenCalledWith('doINeedAMarineLicence')
    expect(getBackLink).toHaveBeenCalledWith(request, '/sea', 'question')
    expect(getAnswerForRoute).toHaveBeenCalledWith(request, '/sea')
    expect(h.view).toHaveBeenCalledWith('journey/self-service/question/index', {
      pageTitle: 'Where will the activity take place?',
      question: mockQuestion,
      section: mockSection,
      backLink: '/journey/self-service/start',
      selectedAnswers: []
    })
  })

  test('throws Boom.notFound when question is not found', () => {
    vi.mocked(getQuestion).mockReturnValue(null)
    const request = {
      params: { questionPath: 'nonexistent' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    expect(() => questionController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 404 })
      })
    )
  })

  test('passes null section when question has no section', () => {
    vi.mocked(getQuestion).mockReturnValue({
      ...mockQuestion,
      section: undefined
    })
    vi.mocked(getSection).mockReturnValue(null)
    const request = {
      params: { questionPath: 'sea' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    questionController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/question/index',
      expect.objectContaining({ section: null })
    )
  })

  test('passes selectedAnswers when a previous answer exists', () => {
    vi.mocked(getAnswerForRoute).mockReturnValue(['inSea'])
    const request = {
      params: { questionPath: 'sea' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    questionController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/question/index',
      expect.objectContaining({ selectedAnswers: ['inSea'] })
    )
  })

  test('passes empty selectedAnswers for a multi-select question even when a prior selection exists', () => {
    const multiSelectQuestion = {
      route: '/construction/maintenance-existing-works',
      text: 'Sub-activities',
      section: 'subactivityType',
      multiSelect: {
        questionRoute: '/x',
        outcomeRoute: '/y',
        outcomeAnswerId: 'OTHER_MAINTENANCE'
      },
      answers: [{ id: 'SCAFFOLDING_ACCESS_TOWERS' }]
    }
    vi.mocked(getQuestion).mockReturnValue(multiSelectQuestion)
    vi.mocked(getAnswerForRoute).mockReturnValue(['SCAFFOLDING_ACCESS_TOWERS'])

    const request = {
      params: { questionPath: 'construction/maintenance-existing-works' }
    }
    const h = { view: vi.fn() }

    questionController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/question/index',
      expect.objectContaining({ selectedAnswers: [] })
    )
  })

  test('logs unknown-question-route on 404', () => {
    vi.mocked(getQuestion).mockReturnValue(null)
    const request = {
      params: { questionPath: 'nope/route' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    expect(() => questionController.handler(request, h)).toThrow()

    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'unknown-question-route',
      '/nope/route',
      expect.any(String),
      expect.any(String)
    )
  })
})

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
      payload: { answer: 'inSea' },
      logger: { warn: vi.fn() }
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
      payload: { answer: 'construction' },
      logger: { warn: vi.fn() }
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
      payload: {},
      logger: { warn: vi.fn() }
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
      payload: null,
      logger: { warn: vi.fn() }
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
      payload: { answer: 'anything' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    expect(() => questionPostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 404 })
      })
    )
  })

  test('logs unknown-question-route on 404', () => {
    vi.mocked(getQuestion).mockReturnValue(null)
    const request = {
      params: { questionPath: 'nope/route' },
      payload: { answer: 'anything' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    expect(() => questionPostController.handler(request, h)).toThrow()

    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'unknown-question-route',
      '/nope/route',
      expect.any(String),
      expect.any(String)
    )
  })

  test('logs answer-no-route at error level when calculateNextRoute throws "no route"', () => {
    vi.mocked(calculateNextRoute).mockImplementation(() => {
      throw new Error(
        "Answer 'broken' on question '/sea' has no nextQuestionRoute or outcomeRoute"
      )
    })
    const request = {
      params: { questionPath: 'sea' },
      payload: { answer: 'broken' },
      logger: { warn: vi.fn(), error: vi.fn() }
    }
    const h = { redirect: vi.fn(), view: vi.fn() }

    expect(() => questionPostController.handler(request, h)).toThrow()

    expect(reportRuntimeError).toHaveBeenCalledWith(
      request,
      'answer-no-route',
      '/sea#broken',
      expect.any(String),
      expect.any(String)
    )
    expect(reportRuntimeIssue).not.toHaveBeenCalledWith(
      request,
      'answer-no-route',
      expect.anything(),
      expect.anything(),
      expect.anything()
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
