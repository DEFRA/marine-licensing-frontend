import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: { get: vi.fn() }
}))

vi.mock('#src/server/journey/self-service/services/journey-data.js', () => ({
  getDocumentPreambleText: vi.fn(() => 'Static preamble text'),
  getQuestion: vi.fn(),
  getOutcome: vi.fn(),
  getOutcomeType: vi.fn(),
  getOutcomeTypesForOutcome: vi.fn()
}))

const { iatAnswersService } =
  await import('#src/services/iat-answers-service/iat-answers.service.js')
const {
  getDocumentPreambleText,
  getQuestion,
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome
} = await import('#src/server/journey/self-service/services/journey-data.js')
const { answerController } = await import('./controller.js')

function buildH() {
  return { view: vi.fn() }
}

describe('answerController', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getDocumentPreambleText.mockReturnValue('Static preamble text')
  })

  it('renders the answer page deriving display from the new log shape', async () => {
    getQuestion.mockImplementation((route) =>
      route === '/sea'
        ? {
            route: '/sea',
            text: 'Where is the activity?',
            answers: [
              { id: 'inSea', text: 'In the sea' },
              { id: 'onLand', text: 'On land' }
            ]
          }
        : null
    )
    getOutcomeType.mockReturnValue({ text: 'A marine licence is required.' })

    const doc = {
      createdAt: new Date('2026-05-23T10:00:00Z'),
      answers: [
        { type: 'question', questionRoute: '/sea', answerIds: ['inSea'] },
        {
          type: 'outcome',
          outcomeRoute: '/mod-permission',
          outcomeTypeId: 'WO_STANDARD_TRACK_MLA'
        }
      ]
    }
    iatAnswersService.get.mockResolvedValue(doc)

    const h = buildH()
    await answerController.handler(
      { params: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/answer/index',
      expect.objectContaining({
        heading: 'Marine licence requirement check',
        introductionText: 'Static preamble text',
        dateOfCheck: doc.createdAt,
        summaryText: 'A marine licence is required.',
        answers: [
          {
            questionRoute: '/sea',
            questionText: 'Where is the activity?',
            answers: [{ id: 'inSea', text: 'In the sea' }]
          }
        ]
      })
    )
  })

  it('throws 404 when the doc is missing', async () => {
    iatAnswersService.get.mockResolvedValue(null)
    await expect(
      answerController.handler(
        { params: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } },
        buildH()
      )
    ).rejects.toMatchObject({ output: { statusCode: 404 } })
  })

  it('returns empty summaryText when there is no outcome entry in the log', async () => {
    const doc = {
      createdAt: new Date('2026-05-23T10:00:00Z'),
      answers: [
        { type: 'question', questionRoute: '/sea', answerIds: ['inSea'] }
      ]
    }
    iatAnswersService.get.mockResolvedValue(doc)
    getQuestion.mockReturnValue({
      route: '/sea',
      text: 'Where?',
      answers: [{ id: 'inSea', text: 'In the sea' }]
    })

    const h = buildH()
    await answerController.handler(
      { params: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/answer/index',
      expect.objectContaining({ summaryText: '' })
    )
  })

  it('falls back to outcome.text when outcomeType has no text', async () => {
    getOutcomeType.mockReturnValue(null)
    getOutcome.mockReturnValue({
      text: 'Fallback outcome text',
      outcomeTypes: []
    })
    getOutcomeTypesForOutcome.mockReturnValue([])

    const doc = {
      createdAt: new Date('2026-05-23T10:00:00Z'),
      answers: [
        {
          type: 'outcome',
          outcomeRoute: '/not-licensable',
          outcomeTypeId: 'WO_NOT_LICENSABLE'
        }
      ]
    }
    iatAnswersService.get.mockResolvedValue(doc)

    const h = buildH()
    await answerController.handler(
      { params: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/answer/index',
      expect.objectContaining({
        summaryText: 'Fallback outcome text',
        answers: []
      })
    )
  })

  it('filters out outcome entries from the answers display list', async () => {
    getQuestion.mockImplementation((route) =>
      route === '/sea'
        ? {
            route: '/sea',
            text: 'Where?',
            answers: [{ id: 'inSea', text: 'In the sea' }]
          }
        : null
    )
    getOutcomeType.mockReturnValue({ text: 'Summary' })

    const doc = {
      createdAt: new Date('2026-05-23T10:00:00Z'),
      answers: [
        { type: 'question', questionRoute: '/sea', answerIds: ['inSea'] },
        {
          type: 'outcome',
          outcomeRoute: '/mod-permission',
          outcomeTypeId: 'WO_STANDARD_TRACK_MLA'
        }
      ]
    }
    iatAnswersService.get.mockResolvedValue(doc)

    const h = buildH()
    await answerController.handler(
      { params: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } },
      h
    )

    const [, viewModel] = h.view.mock.calls[0]
    expect(viewModel.answers).toHaveLength(1)
    expect(viewModel.answers[0].questionRoute).toBe('/sea')
  })
})
