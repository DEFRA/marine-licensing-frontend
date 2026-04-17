import { vi } from 'vitest'
import {
  getAnswers,
  getAnswerForRoute,
  pushAnswer,
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
      const answers = [{ questionRoute: '/sea', answerId: 'inSea' }]
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
        { questionRoute: '/sea', answerId: 'inSea' }
      ])
      expect(getAnswerForRoute(request, '/sea')).toBe('inSea')
    })

    test('returns null when question route is not in answers', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' }
      ])
      expect(getAnswerForRoute(request, '/jurisdiction')).toBeNull()
    })

    test('returns null when answers are empty', () => {
      const request = createMockRequest(null)
      expect(getAnswerForRoute(request, '/sea')).toBeNull()
    })
  })

  describe('#pushAnswer', () => {
    test('appends answer to existing answers', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' }
      ])
      pushAnswer(request, '/jurisdiction', 'englandWales')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { questionRoute: '/sea', answerId: 'inSea' },
        { questionRoute: '/jurisdiction', answerId: 'englandWales' }
      ])
    })

    test('creates new answers array when none exists', () => {
      const request = createMockRequest(null)
      pushAnswer(request, '/sea', 'inSea')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { questionRoute: '/sea', answerId: 'inSea' }
      ])
    })

    test('truncates future answers when re-answering an earlier question', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' },
        { questionRoute: '/jurisdiction', answerId: 'englandWales' },
        { questionRoute: '/activity-type', answerId: 'construction' }
      ])
      pushAnswer(request, '/jurisdiction', 'scotland')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [
        { questionRoute: '/sea', answerId: 'inSea' },
        { questionRoute: '/jurisdiction', answerId: 'scotland' }
      ])
    })
  })

  describe('#getBackLink', () => {
    test('returns start page when answers are empty', () => {
      const request = createMockRequest([])
      expect(getBackLink(request, '/sea')).toBe(IAT_START)
    })

    test('returns the previous answer route when current route is in answers', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' },
        { questionRoute: '/jurisdiction', answerId: 'englandWales' }
      ])
      expect(getBackLink(request, '/jurisdiction')).toBe(`${ROUTE_PREFIX}/sea`)
    })

    test('returns start page when current route is the first in answers', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' },
        { questionRoute: '/jurisdiction', answerId: 'englandWales' }
      ])
      expect(getBackLink(request, '/sea')).toBe(IAT_START)
    })

    test('returns last answer route when current route is not in answers', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' },
        { questionRoute: '/jurisdiction', answerId: 'englandWales' }
      ])
      expect(getBackLink(request, '/activity-type')).toBe(
        `${ROUTE_PREFIX}/jurisdiction`
      )
    })

    test('returns start page when answers are null', () => {
      const request = createMockRequest(null)
      expect(getBackLink(request, '/sea')).toBe(IAT_START)
    })
  })

  describe('#clearAnswers', () => {
    test('sets answers to empty array', () => {
      const request = createMockRequest([
        { questionRoute: '/sea', answerId: 'inSea' }
      ])
      clearAnswers(request)
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceAnswers', [])
    })
  })
})
