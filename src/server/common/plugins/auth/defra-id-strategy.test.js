import { vi } from 'vitest'
import { getDefraIdConfig } from '#src/server/common/plugins/auth/defra-id-strategy.js'
import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
vi.mock('#src/server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({ error: vi.fn() }))
}))
vi.mock('~/src/config/config.js')

describe('#getDefraIdConfig', () => {
  let mockProvider
  let mockDefraIdConfig
  let mockCookieConfig

  beforeEach(() => {
    mockProvider = {
      protocol: 'oauth2',
      auth: 'https://test-auth-endpoint',
      token: 'https://test-token-endpoint'
    }

    mockDefraIdConfig = {
      redirectUrl: 'http://localhost:3000',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      serviceId: 'test-service-id'
    }

    mockCookieConfig = {
      password: 'test-cookie-password-with-min-32-chars',
      secure: true
    }

    config.get.mockImplementation((key) => {
      if (key === 'defraId') return mockDefraIdConfig
      if (key === 'session.cookie') return mockCookieConfig
      return null
    })
  })

  test('Returns config with correct location URL', async () => {
    const result = await getDefraIdConfig(mockProvider)

    expect(result.location()).toBe(
      `${mockDefraIdConfig.redirectUrl}${routes.AUTH_DEFRA_ID_CALLBACK}`
    )
    expect(result.location()).toBe('http://localhost:3000/signin-oidc')
  })

  test('Returns config with correct provider', async () => {
    const result = await getDefraIdConfig(mockProvider)

    expect(result.provider).toBe(mockProvider)
  })

  test('Returns config with correct clientId and clientSecret', async () => {
    const result = await getDefraIdConfig(mockProvider)

    expect(result.clientId).toBe('test-client-id')
    expect(result.clientSecret).toBe('test-client-secret')
  })

  test('Returns config with correct password from cookie config', async () => {
    const result = await getDefraIdConfig(mockProvider)

    expect(result.password).toBe('test-cookie-password-with-min-32-chars')
  })

  test('Returns config with correct isSecure from cookie config', async () => {
    const result = await getDefraIdConfig(mockProvider)

    expect(result.isSecure).toBe(true)
  })

  test('Returns config with isSecure false when cookie.secure is false', async () => {
    mockCookieConfig.secure = false

    const result = await getDefraIdConfig(mockProvider)

    expect(result.isSecure).toBe(false)
  })

  test('providerParams returns serviceId without forceReselection when change-organisation is not true', async () => {
    const result = await getDefraIdConfig(mockProvider)
    const mockRequest = {
      query: {}
    }

    const providerParams = result.providerParams(mockRequest)

    expect(providerParams).toEqual({
      serviceId: 'test-service-id'
    })
    expect(providerParams.forceReselection).toBeUndefined()
  })

  test('providerParams returns serviceId with forceReselection when change-organisation is true', async () => {
    const result = await getDefraIdConfig(mockProvider)
    const mockRequest = {
      query: {
        'change-organisation': 'true'
      }
    }

    const providerParams = result.providerParams(mockRequest)

    expect(providerParams).toEqual({
      serviceId: 'test-service-id',
      forceReselection: true
    })
  })

  test('providerParams does not include forceReselection when change-organisation is false string', async () => {
    const result = await getDefraIdConfig(mockProvider)
    const mockRequest = {
      query: {
        'change-organisation': 'false'
      }
    }

    const providerParams = result.providerParams(mockRequest)

    expect(providerParams).toEqual({
      serviceId: 'test-service-id'
    })
    expect(providerParams.forceReselection).toBeUndefined()
  })

  test('providerParams does not include forceReselection when change-organisation is any other value', async () => {
    const result = await getDefraIdConfig(mockProvider)
    const mockRequest = {
      query: {
        'change-organisation': 'yes'
      }
    }

    const providerParams = result.providerParams(mockRequest)

    expect(providerParams).toEqual({
      serviceId: 'test-service-id'
    })
    expect(providerParams.forceReselection).toBeUndefined()
  })

  test('Config retrieves values from correct config paths', async () => {
    await getDefraIdConfig(mockProvider)

    expect(config.get).toHaveBeenCalledWith('defraId')
    expect(config.get).toHaveBeenCalledWith('session.cookie')
  })
})
