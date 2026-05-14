import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: { get: vi.fn() }
}))

const { iatAnswersService } =
  await import('#src/services/iat-answers-service/iat-answers.service.js')
const { answerController } = await import('./controller.js')

function buildH() {
  return { view: vi.fn() }
}

describe('answerController', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders the answer page with doc fields', async () => {
    const doc = {
      createdAt: new Date('2026-05-01T12:00:00Z'),
      outcome: { summaryText: 'Summary text' },
      answers: [{ questionRoute: '/q', questionText: 'Q?', answers: [] }]
    }
    iatAnswersService.get.mockResolvedValue(doc)

    const h = buildH()
    await answerController.handler(
      { params: { id: '507f1f77bcf86cd799439011' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/answer/index',
      expect.objectContaining({
        heading: 'Marine licence requirement check',
        summaryText: 'Summary text',
        dateOfCheck: doc.createdAt,
        answers: doc.answers
      })
    )
  })

  it('throws 404 when the doc is missing', async () => {
    iatAnswersService.get.mockResolvedValue(null)
    await expect(
      answerController.handler(
        { params: { id: '507f1f77bcf86cd799439011' } },
        buildH()
      )
    ).rejects.toMatchObject({ output: { statusCode: 404 } })
  })

  it('falls back gracefully when outcome.summaryText is missing', async () => {
    const doc = {
      createdAt: new Date(),
      outcome: {},
      answers: []
    }
    iatAnswersService.get.mockResolvedValue(doc)

    const h = buildH()
    await answerController.handler(
      { params: { id: '507f1f77bcf86cd799439011' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/answer/index',
      expect.objectContaining({ summaryText: '' })
    )
  })
})
