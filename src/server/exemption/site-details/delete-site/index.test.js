import { vi } from 'vitest'
import { deleteSiteRoutes } from './index.js'
import { routes } from '~/src/server/common/constants/routes.js'

vi.mock('./controller.js', () => ({
  deleteSiteController: {
    handler: vi.fn()
  },
  deleteSiteSubmitController: {
    handler: vi.fn()
  }
}))

describe('deleteSiteRoutes', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(deleteSiteRoutes)).toBe(true)
    expect(deleteSiteRoutes).toHaveLength(2)
  })

  it('should have the correct GET route configuration', () => {
    const route = deleteSiteRoutes[0]

    expect(route.method).toBe('GET')
    expect(route.path).toBe(routes.DELETE_SITE)
    expect(route.handler).toBeDefined()
  })

  it('should have the correct POST route configuration', () => {
    const route = deleteSiteRoutes[1]

    expect(route.method).toBe('POST')
    expect(route.path).toBe(routes.DELETE_SITE)
    expect(route.handler).toBeDefined()
  })

  it('should include the deleteSiteController for the GET route', () => {
    const route = deleteSiteRoutes[0]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })

  it('should include the deleteSiteSubmitController for the POST route', () => {
    const route = deleteSiteRoutes[1]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })
})
