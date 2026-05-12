import { describe, expect, test, vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js', () => ({
  getQuestion: vi.fn(),
  getOutcome: vi.fn(),
  getOutcomeType: vi.fn()
}))
vi.mock('#src/server/journey/self-service/services/session-answers.js', () => ({
  getAnswers: vi.fn()
}))

const { getQuestion, getOutcome, getOutcomeType } =
  await import('#src/server/journey/self-service/services/journey-data.js')
const { getAnswers } =
  await import('#src/server/journey/self-service/services/session-answers.js')
const { buildIatAnswersPayload } = await import('./iat-answers-payload.js')

describe('buildIatAnswersPayload', () => {
  test('builds payload with single and multi-select answers in order', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/sea', answerIds: ['inSea'] },
      {
        type: 'question',
        questionRoute: '/materials',
        answerIds: ['sand', 'gravel']
      }
    ])
    getQuestion.mockImplementation((route) =>
      route === '/sea'
        ? {
            route: '/sea',
            text: 'Where?',
            answers: [
              { id: 'inSea', text: 'In the sea' },
              { id: 'onLand', text: 'On land' }
            ]
          }
        : {
            route: '/materials',
            text: 'Materials?',
            answers: [
              { id: 'sand', text: 'Sand' },
              { id: 'gravel', text: 'Gravel' },
              { id: 'rock', text: 'Rock' }
            ]
          }
    )
    getOutcome.mockReturnValue({ text: 'Outcome summary' })
    getOutcomeType.mockReturnValue({ text: 'Outcome type text' })

    const result = buildIatAnswersPayload({}, '/outcome/x', 'lnr-x')

    expect(result.outcome).toEqual({
      route: '/outcome/x',
      typeId: 'lnr-x',
      summaryText: 'Outcome type text'
    })
    expect(result.answers).toEqual([
      {
        questionRoute: '/sea',
        questionText: 'Where?',
        answers: [{ id: 'inSea', text: 'In the sea' }]
      },
      {
        questionRoute: '/materials',
        questionText: 'Materials?',
        answers: [
          { id: 'sand', text: 'Sand' },
          { id: 'gravel', text: 'Gravel' }
        ]
      }
    ])
  })

  test('returns null when a question route has no matching JSON entry', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/missing', answerIds: ['x'] }
    ])
    getQuestion.mockReturnValue(null)
    getOutcome.mockReturnValue({ text: 'x' })
    expect(buildIatAnswersPayload({}, '/o')).toBeNull()
  })

  test('returns null when there are no question entries', () => {
    getAnswers.mockReturnValue([])
    getOutcome.mockReturnValue({ text: 'x' })
    expect(buildIatAnswersPayload({}, '/o')).toBeNull()
  })

  test('falls back to outcome.text when no outcomeTypeId', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/q', answerIds: ['a'] }
    ])
    getQuestion.mockReturnValue({
      route: '/q',
      text: 'Q?',
      answers: [{ id: 'a', text: 'A' }]
    })
    getOutcome.mockReturnValue({ text: 'Just outcome' })
    const result = buildIatAnswersPayload({}, '/o')
    expect(result.outcome.summaryText).toBe('Just outcome')
    expect(result.outcome.typeId).toBe('')
  })

  test('returns null when the outcome route is not in the JSON', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/q', answerIds: ['a'] }
    ])
    getQuestion.mockReturnValue({
      route: '/q',
      text: 'Q?',
      answers: [{ id: 'a', text: 'A' }]
    })
    getOutcome.mockReturnValue(null)
    expect(buildIatAnswersPayload({}, '/missing-outcome')).toBeNull()
  })
})
