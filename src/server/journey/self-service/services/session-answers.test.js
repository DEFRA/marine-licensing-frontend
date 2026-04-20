import { vi } from 'vitest'
import {
  getAnswers,
  getAnswerForRoute,
  pushAnswer,
  pushOutcomeSelection,
  getOutcomeSelection,
  getBackLink,
  clearAnswers
} from '#src/server/journey/self-service/services/session-answers.js'
import { ROUTE_PREFIX } from '#src/server/journey/self-service/services/journey-data.js'
import { routes } from '#src/server/common/constants/routes.js'

const { IAT_START } = routes

function createMockRequest(answers = []) {
  return {
    yar: {
      get: vi.fn().mockReturnValue(answers),
      set: vi.fn()
    }
  }
}

describe('#session-answers', () => {
  describe('#getAnswers', () => {
    test('returns the answers array', () => {
      const answers = [
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' }
      ]
      const request = createMockRequest(answers)
      expect(getAnswers(request)).toEqual(answers)
    })

    test('returns empty array when no answers stored', () => {
      const request = createMockRequest(null)
      expect(getAnswers(request)).toEqual([])
    })
  })

  describe('#getAnswerForRoute', () => {
    test('returns the answerId for a known question route', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' }
      ])
      expect(getAnswerForRoute(request, '/sea')).toBe('inSea')
    })

    test('returns null when route is not in answers', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' }
      ])
      expect(getAnswerForRoute(request, '/jurisdiction')).toBeNull()
    })

    test('returns null when answers are empty', () => {
      const request = createMockRequest(null)
      expect(getAnswerForRoute(request, '/sea')).toBeNull()
    })

    test('treats a legacy entry (no type) as a question entry', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' }
      ])
      expect(getAnswerForRoute(request, '/sea')).toBe('inSea')
    })

    test('does not match outcome entries by their outcomeRoute', () => {
      const request = createMockRequest([
        {
          type: 'outcome',
          outcomeRoute: '/construction/journey-select',
          outcomeTypeId: 'WO_CON_SELF_SERVICE_JOURNEY'
        }
      ])
      expect(
        getAnswerForRoute(request, '/construction/journey-select')
      ).toBeNull()
    })
  })

  describe('#pushAnswer', () => {
    test('appends a question entry with type field', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' }
      ])
      pushAnswer(request, '/jurisdiction', 'englandWales')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'question',
          questionRoute: '/jurisdiction',
          answerId: 'englandWales'
        }
      ])
    })

    test('creates a new answers array when none exists', () => {
      const request = createMockRequest(null)
      pushAnswer(request, '/sea', 'inSea')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' }
      ])
    })

    test('truncates future entries when re-answering an earlier question', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'question',
          questionRoute: '/jurisdiction',
          answerId: 'englandWales'
        },
        {
          type: 'question',
          questionRoute: '/activity-type',
          answerId: 'construction'
        }
      ])
      pushAnswer(request, '/jurisdiction', 'scotland')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'question',
          questionRoute: '/jurisdiction',
          answerId: 'scotland'
        }
      ])
    })

    test('matches a legacy entry (no type) on truncation', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' },
        { questionRoute: '/jurisdiction', answerId: 'englandWales' }
      ])
      pushAnswer(request, '/jurisdiction', 'scotland')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'question',
          questionRoute: '/jurisdiction',
          answerId: 'scotland'
        }
      ])
    })
  })

  describe('#pushOutcomeSelection', () => {
    test('appends an outcome entry', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' }
      ])
      pushOutcomeSelection(
        request,
        '/construction/journey-select',
        'WO_CON_SELF_SERVICE_JOURNEY'
      )
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'outcome',
          outcomeRoute: '/construction/journey-select',
          outcomeTypeId: 'WO_CON_SELF_SERVICE_JOURNEY'
        }
      ])
    })

    test('truncates future entries when re-selecting an earlier outcome', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'outcome',
          outcomeRoute: '/construction/journey-select',
          outcomeTypeId: 'WO_CON_EXEMPTION_JOURNEY'
        },
        {
          type: 'question',
          questionRoute: '/exemption/construction',
          answerId: 'noExemption'
        }
      ])
      pushOutcomeSelection(
        request,
        '/construction/journey-select',
        'WO_CON_SELF_SERVICE_JOURNEY'
      )
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'outcome',
          outcomeRoute: '/construction/journey-select',
          outcomeTypeId: 'WO_CON_SELF_SERVICE_JOURNEY'
        }
      ])
    })
  })

  describe('#getOutcomeSelection', () => {
    test('returns the outcomeTypeId for a known outcome route', () => {
      const request = createMockRequest([
        {
          type: 'outcome',
          outcomeRoute: '/construction/journey-select',
          outcomeTypeId: 'WO_CON_SELF_SERVICE_JOURNEY'
        }
      ])
      expect(getOutcomeSelection(request, '/construction/journey-select')).toBe(
        'WO_CON_SELF_SERVICE_JOURNEY'
      )
    })

    test('returns null when the outcome is not stored', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' }
      ])
      expect(
        getOutcomeSelection(request, '/construction/journey-select')
      ).toBeNull()
    })
  })

  describe('#getBackLink', () => {
    test('returns start page when answers are empty', () => {
      const request = createMockRequest([])
      expect(getBackLink(request, '/sea', 'question')).toBe(IAT_START)
    })

    test('returns previous question URL when current is a later question', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'question',
          questionRoute: '/jurisdiction',
          answerId: 'englandWales'
        }
      ])
      expect(getBackLink(request, '/jurisdiction', 'question')).toBe(
        `${ROUTE_PREFIX}/sea`
      )
    })

    test('returns /outcome/ prefixed URL when previous entry is an outcome', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'outcome',
          outcomeRoute: '/construction/journey-select',
          outcomeTypeId: 'WO_CON_SELF_SERVICE_JOURNEY'
        },
        {
          type: 'question',
          questionRoute: '/construction/activity',
          answerId: 'someAnswer'
        }
      ])
      expect(getBackLink(request, '/construction/activity', 'question')).toBe(
        `${ROUTE_PREFIX}/outcome/construction/journey-select`
      )
    })

    test('returns previous entry URL when current is an outcome with a question before it', () => {
      const request = createMockRequest([
        {
          type: 'question',
          questionRoute: '/activity-type',
          answerId: 'construction'
        },
        {
          type: 'outcome',
          outcomeRoute: '/construction/journey-select',
          outcomeTypeId: 'WO_CON_SELF_SERVICE_JOURNEY'
        }
      ])
      expect(
        getBackLink(request, '/construction/journey-select', 'outcome')
      ).toBe(`${ROUTE_PREFIX}/activity-type`)
    })

    test('returns start page when current is the first entry', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'question',
          questionRoute: '/jurisdiction',
          answerId: 'englandWales'
        }
      ])
      expect(getBackLink(request, '/sea', 'question')).toBe(IAT_START)
    })

    test('returns last entry URL when current is not in the array', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' },
        {
          type: 'question',
          questionRoute: '/jurisdiction',
          answerId: 'englandWales'
        }
      ])
      expect(getBackLink(request, '/activity-type', 'question')).toBe(
        `${ROUTE_PREFIX}/jurisdiction`
      )
    })

    test('returns start page when answers are null', () => {
      const request = createMockRequest(null)
      expect(getBackLink(request, '/sea', 'question')).toBe(IAT_START)
    })

    test('treats legacy entry (no type) as a question entry when matching current', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' },
        { questionRoute: '/jurisdiction', answerId: 'englandWales' }
      ])
      expect(getBackLink(request, '/jurisdiction', 'question')).toBe(
        `${ROUTE_PREFIX}/sea`
      )
    })
  })

  describe('#clearAnswers', () => {
    test('sets answers to empty array', () => {
      const request = createMockRequest([
        { type: 'question', questionRoute: '/sea', answerId: 'inSea' }
      ])
      clearAnswers(request)
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [])
    })
  })
})
