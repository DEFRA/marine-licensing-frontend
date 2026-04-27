import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js')
vi.mock('#src/server/journey/self-service/services/session-answers.js')

import { questionController } from '#src/server/journey/self-service/question/controller.js'
import {
  getQuestion,
  getSection
} from '#src/server/journey/self-service/services/journey-data.js'
import {
  getBackLink,
  getAnswerForRoute
} from '#src/server/journey/self-service/services/session-answers.js'

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
    const request = { params: { questionPath: 'sea' } }
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
    const request = { params: { questionPath: 'nonexistent' } }
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
    const request = { params: { questionPath: 'sea' } }
    const h = { view: vi.fn() }

    questionController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/question/index',
      expect.objectContaining({ section: null })
    )
  })

  test('passes selectedAnswers when a previous answer exists', () => {
    vi.mocked(getAnswerForRoute).mockReturnValue(['inSea'])
    const request = { params: { questionPath: 'sea' } }
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
})
