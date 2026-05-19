import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: { get: vi.fn() }
}))

vi.mock('#src/server/journey/self-service/services/journey-data.js', () => ({
  getDocumentPreambleText: vi.fn(() => 'Static preamble text')
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
      { params: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/answer/index',
      expect.objectContaining({
        heading: 'Marine licence requirement check',
        introductionText: 'Static preamble text',
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
        { params: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } },
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
      { params: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } },
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/answer/index',
      expect.objectContaining({ summaryText: '' })
    )
  })
})
