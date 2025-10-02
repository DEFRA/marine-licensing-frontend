import { vi } from 'vitest'
import { deleteExemptionRoutes } from './index.js'
import { routes } from '~/src/server/common/constants/routes.js'

vi.mock('./controller.js', () => ({
  deleteExemptionController: {
    handler: vi.fn()
  },
  deleteExemptionSelectController: {
    handler: vi.fn()
  },
  deleteExemptionSubmitController: {
    handler: vi.fn()
  }
}))

describe('deleteExemptionRoutes', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(deleteExemptionRoutes)).toBe(true)
    expect(deleteExemptionRoutes).toHaveLength(3)
  })

  it('should have the correct main delete route configuration', () => {
    const route = deleteExemptionRoutes[0]

    expect(route.method).toBe('GET')
    expect(route.path).toBe(routes.DELETE_EXEMPTION)
    expect(route.handler).toBeDefined()
  })

  it('should have the correct select exemption route configuration', () => {
    const route = deleteExemptionRoutes[1]

    expect(route.method).toBe('GET')
    expect(route.path).toBe(`${routes.DELETE_EXEMPTION}/{exemptionId}`)
    expect(route.handler).toBeDefined()
  })

  it('should have the correct submit delete route configuration', () => {
    const route = deleteExemptionRoutes[2]

    expect(route.method).toBe('POST')
    expect(route.path).toBe(routes.DELETE_EXEMPTION)
    expect(route.handler).toBeDefined()
  })

  it('should include the deleteExemptionController for the main route', () => {
    const route = deleteExemptionRoutes[0]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })

  it('should include the deleteExemptionSelectController for the select route', () => {
    const route = deleteExemptionRoutes[1]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })

  it('should include the deleteExemptionSubmitController for the submit route', () => {
    const route = deleteExemptionRoutes[2]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })
})
