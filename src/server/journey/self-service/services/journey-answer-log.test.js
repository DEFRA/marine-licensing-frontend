import { describe, it, expect } from 'vitest'
import {
  getAnswerForRoute,
  pushAnswer,
  pushOutcomeSelection,
  getOutcomeSelection,
  getBackLink
} from './journey-answer-log.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('journey-answer-log', () => {
  describe('pushAnswer', () => {
    it('appends a new question entry', () => {
      const out = pushAnswer([], '/x', ['A'])
      expect(out).toEqual([
        { type: 'question', questionRoute: '/x', answerIds: ['A'] }
      ])
    })

    it('overwrites the existing answer for the same question, dropping later entries', () => {
      const log = [
        { type: 'question', questionRoute: '/x', answerIds: ['A'] },
        { type: 'question', questionRoute: '/y', answerIds: ['B'] },
        { type: 'outcome', outcomeRoute: '/o', outcomeTypeId: 'WO' }
      ]
      const out = pushAnswer(log, '/x', ['C'])
      expect(out).toEqual([
        { type: 'question', questionRoute: '/x', answerIds: ['C'] }
      ])
    })

    it('returns a new array (does not mutate input)', () => {
      const log = [{ type: 'question', questionRoute: '/x', answerIds: ['A'] }]
      const out = pushAnswer(log, '/y', ['B'])
      expect(log).toHaveLength(1)
      expect(out).toHaveLength(2)
    })
  })

  describe('pushOutcomeSelection', () => {
    it('appends a new outcome entry', () => {
      const out = pushOutcomeSelection([], '/o', 'WO_TYPE')
      expect(out).toEqual([
        { type: 'outcome', outcomeRoute: '/o', outcomeTypeId: 'WO_TYPE' }
      ])
    })

    it('overwrites the existing selection for the same outcome route', () => {
      const log = [
        { type: 'outcome', outcomeRoute: '/o', outcomeTypeId: 'A' },
        { type: 'question', questionRoute: '/x', answerIds: ['Z'] }
      ]
      const out = pushOutcomeSelection(log, '/o', 'B')
      expect(out).toEqual([
        { type: 'outcome', outcomeRoute: '/o', outcomeTypeId: 'B' }
      ])
    })
  })

  describe('getAnswerForRoute', () => {
    it('returns the answerIds for the matching question, or [] if absent', () => {
      const log = [
        { type: 'question', questionRoute: '/x', answerIds: ['A', 'B'] }
      ]
      expect(getAnswerForRoute(log, '/x')).toEqual(['A', 'B'])
      expect(getAnswerForRoute(log, '/y')).toEqual([])
    })
  })

  describe('getOutcomeSelection', () => {
    it('returns the outcomeTypeId for the matching outcome route, or null', () => {
      const log = [{ type: 'outcome', outcomeRoute: '/o', outcomeTypeId: 'WO' }]
      expect(getOutcomeSelection(log, '/o')).toBe('WO')
      expect(getOutcomeSelection(log, '/other')).toBeNull()
    })
  })

  describe('getBackLink', () => {
    const slug = 'abcdefghijklmnopqrstuv'

    it('returns the start route when the log is empty', () => {
      expect(getBackLink([], slug, '/x', 'question')).toBe(routes.IAT_START)
    })

    it('returns the URL of the previous entry when current is in the log', () => {
      const log = [
        { type: 'question', questionRoute: '/x', answerIds: ['A'] },
        { type: 'question', questionRoute: '/y', answerIds: ['B'] }
      ]
      const back = getBackLink(log, slug, '/y', 'question')
      expect(back).toBe(`/journey/self-service/c/${slug}/x`)
    })

    it('returns the URL of the last entry when the current entry is not yet in the log (fresh visit)', () => {
      const log = [{ type: 'question', questionRoute: '/x', answerIds: ['A'] }]
      const back = getBackLink(log, slug, '/y', 'question')
      expect(back).toBe(`/journey/self-service/c/${slug}/x`)
    })
  })
})
