import { vi } from 'vitest'
import { createEntraIdStrategy } from '#src/server/common/plugins/auth/entra-id-strategy.js'
import { config } from '#src/config/config.js'
import { openIdProvider } from '#src/server/common/plugins/auth/open-id-provider.js'
import { routes } from '#src/server/common/constants/routes.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'

vi.mock('#src/server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({ error: vi.fn() }))
}))
vi.mock('~/src/config/config.js')
vi.mock('#src/server/common/plugins/auth/open-id-provider.js')

describe('#createEntraIdStrategy', () => {
  let mockServer
  let mockProvider
  let mockEntraIdConfig
  let mockCookieConfig

  beforeEach(() => {
    mockProvider = {
      protocol: 'oauth2',
      auth: 'https://test-entra-auth-endpoint',
      token: 'https://test-entra-token-endpoint'
    }

    mockEntraIdConfig = {
      redirectUrl: 'http://localhost:3000',
      clientId: 'test-entra-client-id',
      clientSecret: 'test-entra-client-secret'
    }

    mockCookieConfig = {
      password: 'test-cookie-password-with-min-32-chars',
      secure: true
    }

    mockServer = {
      auth: {
        strategy: vi.fn()
      }
    }

    config.get.mockImplementation((key) => {
      if (key === 'entraId') return mockEntraIdConfig
      if (key === 'session.cookie') return mockCookieConfig
      return null
    })

    openIdProvider.mockResolvedValue(mockProvider)
  })

  test('Creates OpenID provider with correct parameters', async () => {
    await createEntraIdStrategy(mockServer)

    expect(openIdProvider).toHaveBeenCalledWith('entraId', mockEntraIdConfig)
  })

  test('Registers auth strategy with correct name and type', async () => {
    await createEntraIdStrategy(mockServer)

    expect(mockServer.auth.strategy).toHaveBeenCalledWith(
      AUTH_STRATEGIES.ENTRA_ID,
      'bell',
      expect.any(Object)
    )
  })

  test('Strategy config includes correct properties', async () => {
    await createEntraIdStrategy(mockServer)

    const strategyConfig = mockServer.auth.strategy.mock.calls[0][2]

    expect(strategyConfig.location()).toBe(
      `${mockEntraIdConfig.redirectUrl}${routes.AUTH_ENTRA_ID_CALLBACK}`
    )
    expect(strategyConfig.location()).toBe('http://localhost:3000/auth')
    expect(strategyConfig.provider).toBe(mockProvider)
    expect(strategyConfig.clientId).toBe('test-entra-client-id')
    expect(strategyConfig.clientSecret).toBe('test-entra-client-secret')
    expect(strategyConfig.password).toBe(
      'test-cookie-password-with-min-32-chars'
    )
    expect(strategyConfig.isSecure).toBe(true)
  })

  test('Strategy config has isSecure false when cookie.secure is false', async () => {
    mockCookieConfig.secure = false

    await createEntraIdStrategy(mockServer)

    const strategyConfig = mockServer.auth.strategy.mock.calls[0][2]

    expect(strategyConfig.isSecure).toBe(false)
  })

  test('Retrieves values from correct config paths', async () => {
    await createEntraIdStrategy(mockServer)

    expect(config.get).toHaveBeenCalledWith('entraId')
    expect(config.get).toHaveBeenCalledWith('session.cookie')
  })
})
