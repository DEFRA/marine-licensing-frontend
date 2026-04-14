import { vi } from 'vitest'
import {
  pushRoute,
  getBackLink,
  clearHistory
} from '#src/server/journey/self-service/services/journey-history.js'
import { routes } from '#src/server/common/constants/routes.js'

const { IAT_START } = routes
const ROUTE_PREFIX = IAT_START.replace(/\/start$/, '')

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
      expect(getBackLink(request, '/sea')).toBe(IAT_START)
    })

    test('returns the previous route when current route is in history', () => {
      const request = createMockRequest(['/sea', '/jurisdiction'])
      expect(getBackLink(request, '/jurisdiction')).toBe(`${ROUTE_PREFIX}/sea`)
    })

    test('returns start page when current route is the first in history', () => {
      const request = createMockRequest(['/sea', '/jurisdiction'])
      expect(getBackLink(request, '/sea')).toBe(IAT_START)
    })

    test('returns last route when current route is not in history', () => {
      const request = createMockRequest(['/sea', '/jurisdiction'])
      expect(getBackLink(request, '/activity-type')).toBe(
        `${ROUTE_PREFIX}/jurisdiction`
      )
    })

    test('returns start page when history is null', () => {
      const request = createMockRequest(null)
      expect(getBackLink(request, '/sea')).toBe(IAT_START)
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
