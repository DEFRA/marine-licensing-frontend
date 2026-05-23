import { describe, it, expect, vi } from 'vitest'
import {
  getMappedAnswers,
  getOutcomeContext,
  getChosenOutcomeTypeId,
  buildHandoff
} from './application-handoff.js'

vi.mock('#src/server/journey/self-service/services/journey-data.js', () => ({
  getQuestion: vi.fn((route) => {
    if (route === '/activity-type') {
      return { mcmsAppFormMapping: 'ACTIVITY_TYPE', answers: [{ id: 'CON' }] }
    }
    if (route === '/exemption/construction') {
      return { mcmsAppFormMapping: 'EXE_ACTIVITY_SUBTYPE_CONSTRUCTION', answers: [{ id: 'new' }] }
    }
    if (route === '/construction/activity') {
      return { mcmsAppFormMapping: 'ACTIVITY_SUBTYPE_CONSTRUCTION', answers: [{ id: 'CON_MNTN_FT' }] }
    }
    if (route === '/no-mapping') {
      return { mcmsAppFormMapping: null, answers: [{ id: 'X' }] }
    }
    return null
  }),
  getOutcomeType: vi.fn((id) => {
    if (id === 'WO_EXE_AVAILABLE_ARTICLE_13') {
      return { id, params: [{ name: 'ADV_TYPE', value: 'EXE' }, { name: 'ARTICLE', value: '13' }] }
    }
    if (id === 'WO_ENQUIRY') {
      return { id, params: [{ name: 'ADV_TYPE', value: 'ENQ' }] }
    }
    if (id === 'WO_NO_PARAMS') {
      return { id }
    }
    return null
  })
}))

describe('getMappedAnswers', () => {
  it('emits {mapping: answerId} only for questions whose mcmsAppFormMapping is non-null', () => {
    const out = getMappedAnswers([
      { type: 'question', questionRoute: '/activity-type', answerIds: ['CON'] },
      { type: 'question', questionRoute: '/exemption/construction', answerIds: ['new'] },
      { type: 'question', questionRoute: '/no-mapping', answerIds: ['X'] },
      { type: 'outcome', outcomeRoute: '/o', outcomeTypeId: 'WO_EXE_AVAILABLE_ARTICLE_13' }
    ])
    expect(out).toEqual({
      ACTIVITY_TYPE: 'CON',
      EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: 'new'
    })
  })

  it('treats EXE and non-EXE subtype mappings identically (no special-casing)', () => {
    const out = getMappedAnswers([
      { type: 'question', questionRoute: '/construction/activity', answerIds: ['CON_MNTN_FT'] }
    ])
    expect(out).toEqual({ ACTIVITY_SUBTYPE_CONSTRUCTION: 'CON_MNTN_FT' })
  })

  it('skips questions with empty answerIds', () => {
    const out = getMappedAnswers([
      { type: 'question', questionRoute: '/activity-type', answerIds: [] }
    ])
    expect(out).toEqual({})
  })

  it('skips question routes that are not in the JSON', () => {
    const out = getMappedAnswers([
      { type: 'question', questionRoute: '/not-a-real-route', answerIds: ['X'] }
    ])
    expect(out).toEqual({})
  })
})

describe('getOutcomeContext', () => {
  it('flattens the params array into a name→value object', () => {
    expect(getOutcomeContext('WO_EXE_AVAILABLE_ARTICLE_13')).toEqual({
      outcomeTypeId: 'WO_EXE_AVAILABLE_ARTICLE_13',
      outcomeParams: { ADV_TYPE: 'EXE', ARTICLE: '13' }
    })
  })

  it('returns empty params when the outcomeType has none', () => {
    expect(getOutcomeContext('WO_NO_PARAMS')).toEqual({
      outcomeTypeId: 'WO_NO_PARAMS',
      outcomeParams: {}
    })
  })

  it('returns empty params when the outcomeType id is unknown', () => {
    expect(getOutcomeContext('NOT_A_REAL_ID')).toEqual({
      outcomeTypeId: 'NOT_A_REAL_ID',
      outcomeParams: {}
    })
  })
})

describe('getChosenOutcomeTypeId', () => {
  it('returns the most recent outcome entry id', () => {
    expect(getChosenOutcomeTypeId([
      { type: 'outcome', outcomeRoute: '/a', outcomeTypeId: 'X' },
      { type: 'question', questionRoute: '/q', answerIds: ['A'] },
      { type: 'outcome', outcomeRoute: '/b', outcomeTypeId: 'Y' }
    ])).toBe('Y')
  })

  it('returns null when no outcome has been picked', () => {
    expect(getChosenOutcomeTypeId([
      { type: 'question', questionRoute: '/q', answerIds: ['A'] }
    ])).toBeNull()
  })
})

describe('buildHandoff', () => {
  it('returns null when no outcome is chosen', () => {
    expect(buildHandoff({
      answers: [{ type: 'question', questionRoute: '/q', answerIds: ['A'] }]
    })).toBeNull()
  })

  it('returns null when doc is missing or has no answers', () => {
    expect(buildHandoff(undefined)).toBeNull()
    expect(buildHandoff({})).toBeNull()
  })

  it('combines outcome context, mapped answers, and a null answersUrl (AC5 deferred)', () => {
    const result = buildHandoff({
      answers: [
        { type: 'question', questionRoute: '/activity-type', answerIds: ['CON'] },
        { type: 'outcome', outcomeRoute: '/exemption/construction', outcomeTypeId: 'WO_EXE_AVAILABLE_ARTICLE_13' }
      ]
    })
    expect(result).toEqual({
      outcomeTypeId: 'WO_EXE_AVAILABLE_ARTICLE_13',
      outcomeParams: { ADV_TYPE: 'EXE', ARTICLE: '13' },
      mappedAnswers: { ACTIVITY_TYPE: 'CON' },
      answersUrl: null
    })
  })
})
