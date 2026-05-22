import { describe, expect, test, vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js', () => ({
  getQuestion: vi.fn(),
  getOutcome: vi.fn(),
  getOutcomeType: vi.fn(),
  getOutcomeTypesForOutcome: vi.fn()
}))
vi.mock('#src/server/journey/self-service/services/session-answers.js', () => ({
  getAnswers: vi.fn()
}))

const { getQuestion, getOutcome, getOutcomeType, getOutcomeTypesForOutcome } =
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
    getOutcomeTypesForOutcome.mockReturnValue([
      { id: 'lnr-x', text: 'Outcome type text' }
    ])
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
    getOutcomeTypesForOutcome.mockReturnValue([])
    expect(buildIatAnswersPayload({}, '/o')).toBeNull()
  })

  test('returns null when there are no question entries', () => {
    getAnswers.mockReturnValue([])
    getOutcome.mockReturnValue({ text: 'x' })
    getOutcomeTypesForOutcome.mockReturnValue([])
    expect(buildIatAnswersPayload({}, '/o')).toBeNull()
  })

  test('with no outcomeTypeId and a single outcomeType, uses that outcomeType id and text', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/q', answerIds: ['a'] }
    ])
    getQuestion.mockReturnValue({
      route: '/q',
      text: 'Q?',
      answers: [{ id: 'a', text: 'A' }]
    })
    getOutcome.mockReturnValue({ text: 'Just outcome' })
    getOutcomeTypesForOutcome.mockReturnValue([
      { id: 'terminal-single-id', text: 'Single outcomeType text' }
    ])

    const result = buildIatAnswersPayload({}, '/o')

    expect(result.outcome.typeId).toBe('terminal-single-id')
    expect(result.outcome.summaryText).toBe('Single outcomeType text')
  })

  test('terminal-multi: with no outcomeTypeId and multiple outcomeTypes, falls back to outcomeRoute and outcome.heading', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/q', answerIds: ['a'] }
    ])
    getQuestion.mockReturnValue({
      route: '/q',
      text: 'Q?',
      answers: [{ id: 'a', text: 'A' }]
    })
    getOutcome.mockReturnValue({ heading: 'Outcome heading' })
    getOutcomeTypesForOutcome.mockReturnValue([
      { id: 't1', text: 'one' },
      { id: 't2', text: 'two' }
    ])

    const result = buildIatAnswersPayload({}, '/outcome/multi')

    expect(result.outcome.typeId).toBe('/outcome/multi')
    expect(result.outcome.summaryText).toBe('Outcome heading')
  })

  test('intermediate outcome: with no outcomeTypeId and multiple outcomeTypes, prefers first outcomeType text over outcome.text UI prompt', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/q', answerIds: ['a'] }
    ])
    getQuestion.mockReturnValue({
      route: '/q',
      text: 'Q?',
      answers: [{ id: 'a', text: 'A' }]
    })
    getOutcome.mockReturnValue({
      heading: 'Exemption not available',
      text: 'Please select the service you require.'
    })
    getOutcomeTypesForOutcome.mockReturnValue([
      {
        id: 'WO_CON_NO_EXE_SELF_SERVICE',
        text: 'Based on the information provided an exemption is not available and a marine licence is required.',
        nextQuestionRoute: '/construction/activity'
      },
      {
        id: 'WO_NO_EXE_STANDARD_MLA',
        text: 'Based on the information provided an exemption is not available and a marine licence is required.'
      }
    ])

    const result = buildIatAnswersPayload(
      {},
      '/exemption/construction-exe-not-available-continue'
    )

    expect(result.outcome.summaryText).toBe(
      'Based on the information provided an exemption is not available and a marine licence is required.'
    )
  })

  test('with stashed outcomeTypeId, resolved outcomeType.text wins over outcome.text', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/q', answerIds: ['a'] }
    ])
    getQuestion.mockReturnValue({
      route: '/q',
      text: 'Q?',
      answers: [{ id: 'a', text: 'A' }]
    })
    getOutcome.mockReturnValue({ text: 'Outcome-level text' })
    getOutcomeTypesForOutcome.mockReturnValue([
      { id: 'ot-1', text: 'ot-1 text' },
      { id: 'ot-2', text: 'ot-2 text' }
    ])
    getOutcomeType.mockReturnValue({ text: 'ot-2 text' })

    const result = buildIatAnswersPayload({}, '/o', 'ot-2')

    expect(result.outcome.typeId).toBe('ot-2')
    expect(result.outcome.summaryText).toBe('ot-2 text')
  })

  test('terminal-single outcome with no stashed outcomeTypeId produces non-empty typeId and summaryText', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/q', answerIds: ['a'] }
    ])
    getQuestion.mockReturnValue({
      route: '/q',
      text: 'Q?',
      answers: [{ id: 'a', text: 'A' }]
    })
    getOutcome.mockReturnValue({ heading: 'Heading only', text: '' })
    getOutcomeTypesForOutcome.mockReturnValue([
      { id: 'terminal-type-id', text: 'Terminal outcome type text' }
    ])

    const result = buildIatAnswersPayload({}, '/outcome/terminal')

    expect(result.outcome.typeId).not.toBe('')
    expect(result.outcome.summaryText).not.toBe('')
    expect(result.outcome.typeId).toBe('terminal-type-id')
    expect(result.outcome.summaryText).toBe('Terminal outcome type text')
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
    getOutcomeTypesForOutcome.mockReturnValue([])
    expect(buildIatAnswersPayload({}, '/missing-outcome')).toBeNull()
  })

  test('returns null when every answerId is missing from question.answers[]', () => {
    getAnswers.mockReturnValue([
      { type: 'question', questionRoute: '/q', answerIds: ['ghost'] }
    ])
    getQuestion.mockReturnValue({
      route: '/q',
      text: 'Q?',
      answers: [{ id: 'real', text: 'Real answer' }]
    })
    getOutcome.mockReturnValue({ text: 'Outcome' })
    getOutcomeTypesForOutcome.mockReturnValue([])
    expect(buildIatAnswersPayload({}, '/outcome/x')).toBeNull()
  })
})
