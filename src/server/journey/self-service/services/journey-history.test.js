import { vi } from 'vitest'
import {
  pushRoute,
  getBackLink,
  clearHistory
} from '#src/server/journey/self-service/services/journey-history.js'

const IAT_START = '/journey/self-service/start'
const ROUTE_PREFIX = '/journey/self-service'

function createMockRequest(history = []) {
  return {
    yar: {
      get: vi.fn().mockReturnValue(history),
      set: vi.fn()
    }
  }
}

describe('#journey-history', () => {
  describe('#getBackLink', () => {
    test('returns start page when history is empty', () => {
      const request = createMockRequest([])
      expect(getBackLink(request)).toBe(IAT_START)
    })

    test('returns the last route in history prefixed with route prefix', () => {
      const request = createMockRequest(['/sea', '/jurisdiction'])
      expect(getBackLink(request)).toBe(`${ROUTE_PREFIX}/jurisdiction`)
    })

    test('returns start page when history is null', () => {
      const request = createMockRequest(null)
      expect(getBackLink(request)).toBe(IAT_START)
    })
  })

  describe('#pushRoute', () => {
    test('appends the route to an existing history', () => {
      const request = createMockRequest(['/sea'])
      pushRoute(request, '/jurisdiction')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceHistory', [
        '/sea',
        '/jurisdiction'
      ])
    })

    test('creates a new history when none exists', () => {
      const request = createMockRequest(null)
      pushRoute(request, '/sea')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceHistory', [
        '/sea'
      ])
    })

    test('truncates future history when re-answering an earlier question', () => {
      const request = createMockRequest([
        '/sea',
        '/jurisdiction',
        '/activity-type'
      ])
      pushRoute(request, '/jurisdiction')
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceHistory', [
        '/sea',
        '/jurisdiction'
      ])
    })
  })

  describe('#clearHistory', () => {
    test('resets the history to an empty array', () => {
      const request = createMockRequest(['/sea', '/jurisdiction'])
      clearHistory(request)
      expect(request.yar.set).toHaveBeenCalledWith('selfServiceHistory', [])
    })
  })
})
