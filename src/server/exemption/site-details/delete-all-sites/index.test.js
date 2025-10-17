import { vi } from 'vitest'
import { deleteAllSitesRoutes } from './index.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('./controller.js', () => ({
  deleteAllSitesController: {
    handler: vi.fn()
  },
  deleteAllSitesSubmitController: {
    handler: vi.fn()
  }
}))

describe('deleteAllSitesRoutes', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(deleteAllSitesRoutes)).toBe(true)
    expect(deleteAllSitesRoutes).toHaveLength(2)
  })

  it('should have the correct GET route configuration', () => {
    const route = deleteAllSitesRoutes[0]

    expect(route.method).toBe('GET')
    expect(route.path).toBe(routes.DELETE_ALL_SITES)
    expect(route.handler).toBeDefined()
  })

  it('should have the correct POST route configuration', () => {
    const route = deleteAllSitesRoutes[1]

    expect(route.method).toBe('POST')
    expect(route.path).toBe(routes.DELETE_ALL_SITES)
    expect(route.handler).toBeDefined()
  })

  it('should include the deleteAllSitesController for the GET route', () => {
    const route = deleteAllSitesRoutes[0]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })

  it('should include the deleteAllSitesSubmitController for the POST route', () => {
    const route = deleteAllSitesRoutes[1]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })
})
