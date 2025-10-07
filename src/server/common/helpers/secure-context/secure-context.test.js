import { vi } from 'vitest'
import hapi from '@hapi/hapi'

import { secureContext } from '~/src/server/common/helpers/secure-context/secure-context.js'
import { requestLogger } from '~/src/server/common/helpers/logging/request-logger.js'
import { config } from '~/src/config/config.js'

const mockAddCACert = vi.fn()
const mockTlsCreateSecureContext = vi
  .fn()
  .mockReturnValue({ context: { addCACert: mockAddCACert } })

vi.mock('hapi-pino', () => ({
  default: {
    register: (server) => {
      server.decorate('server', 'logger', {
        info: vi.fn(),
        error: vi.fn()
      })
    },
    name: 'mock-hapi-pino'
  }
}))
vi.mock('node:tls', async () => {
  const actual = await vi.importActual('node:tls')
  return {
    ...actual,
    createSecureContext: (...args) => mockTlsCreateSecureContext(...args)
  }
})

describe('#secureContext', () => {
  let server

  describe('When secure context is disabled', () => {
    beforeEach(async () => {
      config.set('isSecureContextEnabled', false)
      server = hapi.server()
      await server.register([requestLogger, secureContext])
    })

    afterEach(async () => {
      config.set('isSecureContextEnabled', false)
      await server.stop({ timeout: 0 })
    })

    test('secureContext decorator should not be available', () => {
      expect(server.logger.info).toHaveBeenCalledWith(
        'Custom secure context is disabled'
      )
    })

    test('Logger should give us disabled message', () => {
      expect(server.secureContext).toBeUndefined()
    })
  })

  describe('When secure context is enabled', () => {
    const PROCESS_ENV = process.env

    beforeAll(() => {
      process.env = { ...PROCESS_ENV }
      process.env.TRUSTSTORE_ONE = 'mock-trust-store-cert-one'
    })

    beforeEach(async () => {
      mockTlsCreateSecureContext.mockClear()
      mockAddCACert.mockClear()
      config.set('isSecureContextEnabled', true)
      server = hapi.server()
      await server.register([requestLogger, secureContext])
    })

    afterEach(async () => {
      config.set('isSecureContextEnabled', false)
      await server.stop({ timeout: 0 })
    })

    afterAll(() => {
      process.env = PROCESS_ENV
    })

    test('secureContext should be created with certificates', () => {
      expect(server.secureContext).toBeDefined()
      expect(server.secureContext.context).toBeDefined()
    })

    test('secureContext decorator should be available', () => {
      expect(server.secureContext).toEqual(
        expect.objectContaining({
          context: expect.objectContaining({
            addCACert: expect.any(Function)
          })
        })
      )
    })
  })

  describe('When secure context is enabled without TRUSTSTORE_ certs', () => {
    beforeEach(async () => {
      config.set('isSecureContextEnabled', true)
      server = hapi.server()
      await server.register([requestLogger, secureContext])
    })

    afterEach(async () => {
      config.set('isSecureContextEnabled', false)
      await server.stop({ timeout: 0 })
    })

    test('Should log about not finding any TRUSTSTORE_ certs', () => {
      expect(server.logger.info).toHaveBeenCalledWith(
        'Could not find any TRUSTSTORE_ certificates'
      )
    })
  })
})
