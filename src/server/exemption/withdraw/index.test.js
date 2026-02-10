import { vi } from 'vitest'
import { withdrawExemptionRoutes } from './index.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('./controller.js', () => ({
  withdrawExemptionController: {
    handler: vi.fn()
  },
  withdrawExemptionSelectController: {
    handler: vi.fn()
  },
  withdrawExemptionSubmitController: {
    handler: vi.fn()
  }
}))

describe('withdrawExemptionRoutes', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(withdrawExemptionRoutes)).toBe(true)
    expect(withdrawExemptionRoutes).toHaveLength(3)
  })

  it('should have the correct main withdraw route configuration', () => {
    const route = withdrawExemptionRoutes[0]

    expect(route.method).toBe('GET')
    expect(route.path).toBe(routes.WITHDRAW_EXEMPTION)
    expect(route.handler).toBeDefined()
  })

  it('should have the correct select exemption route configuration', () => {
    const route = withdrawExemptionRoutes[1]

    expect(route.method).toBe('GET')
    expect(route.path).toBe(`${routes.WITHDRAW_EXEMPTION}/{exemptionId}`)
    expect(route.handler).toBeDefined()
  })

  it('should have the correct submit withdraw route configuration', () => {
    const route = withdrawExemptionRoutes[2]

    expect(route.method).toBe('POST')
    expect(route.path).toBe(routes.WITHDRAW_EXEMPTION)
    expect(route.handler).toBeDefined()
  })

  it('should include the withdrawExemptionController for the main route', () => {
    const route = withdrawExemptionRoutes[0]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })

  it('should include the withdrawExemptionSelectController for the select route', () => {
    const route = withdrawExemptionRoutes[1]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })

  it('should include the withdrawExemptionSubmitController for the submit route', () => {
    const route = withdrawExemptionRoutes[2]

    expect(route.handler).toBeDefined()
    expect(typeof route.handler).toBe('function')
  })
})
