import { jest } from '@jest/globals'
import { defraId } from '~/src/server/common/plugins/defra-id.js'
import { config } from '~/src/config/config.js'
import { getOidcConfig } from '~/src/server/common/plugins/auth/get-oidc-config.js'
import { openIdProvider } from '~/src/server/common/plugins/auth/open-id.js'
import { validateUserSession } from '~/src/server/common/plugins/auth/validate.js'
import { clearExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('~/src/config/config.js')
jest.mock('~/src/server/common/plugins/auth/get-oidc-config.js')
jest.mock('~/src/server/common/plugins/auth/open-id.js')
jest.mock('~/src/server/common/plugins/auth/validate.js')
jest.mock('~/src/server/common/constants/routes.js')
jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/mcms-context/cache-mcms-context.js')

const mockedGetOidcConfig = jest.mocked(getOidcConfig)
const mockedOpenIdProvider = jest.mocked(openIdProvider)
const mockedValidateUserSession = jest.mocked(validateUserSession)
const mockedClearExemptionCache = jest.mocked(clearExemptionCache)

describe('defraId plugin', () => {
  let mockServer
  let mockOidcConfig
  let mockDefraProvider
  let mockRequest

  beforeEach(() => {
    mockRequest = {
      yar: {
        flash: jest.fn()
      }
    }

    mockOidcConfig = {
      authorization_endpoint: 'https://auth.test.defra.gov.uk/authorize',
      token_endpoint: 'https://auth.test.defra.gov.uk/token',
      end_session_endpoint: 'https://auth.test.defra.gov.uk/logout'
    }

    mockDefraProvider = {
      name: 'defra-id',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: mockOidcConfig.authorization_endpoint,
      token: mockOidcConfig.token_endpoint,
      pkce: 'S256',
      scope: 'openid offline_access',
      profile: jest.fn()
    }

    mockServer = {
      auth: {
        strategy: jest.fn(),
        default: jest.fn()
      }
    }

    config.get.mockImplementation(() => ({
      authEnabled: true,
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      serviceId: 'test-service-id',
      redirectUrl: 'https://test.defra.gov.uk',
      scopes: 'openid offline_access',
      cookie: {
        password: 'test-cookie-password',
        secure: true,
        ttl: 3600000
      }
    }))

    mockedGetOidcConfig.mockResolvedValue(mockOidcConfig)
    mockedOpenIdProvider.mockReturnValue(mockDefraProvider)
    mockedValidateUserSession.mockResolvedValue({ isValid: true })
  })

  test('should correctly name set the auth plugin', () => {
    expect(defraId).toBeInstanceOf(Object)
    expect(defraId.plugin.name).toBe('auth')
    expect(defraId.plugin.register).toBeInstanceOf(Function)
  })

  test('should register plugin successfully when auth is enabled', async () => {
    await defraId.plugin.register(mockServer)

    expect(mockServer.auth.strategy).toHaveBeenCalledTimes(2)
    expect(mockServer.auth.default).toHaveBeenCalledWith('session')
  })

  test('should register basic plugin successfully when auth is disabled', async () => {
    config.get.mockImplementation((key) => {
      if (key === 'defraId') {
        return { authEnabled: false }
      }
      return undefined
    })

    await defraId.plugin.register(mockServer)

    expect(mockServer.auth.strategy).toHaveBeenCalledTimes(1)
    expect(mockServer.auth.strategy).toHaveBeenCalledWith('defra-id', 'basic', {
      validate: expect.any(Function)
    })

    const strategyCall = mockServer.auth.strategy.mock.calls[0]
    const validateFn = strategyCall[2].validate
    expect(validateFn()).toEqual({ isValid: true })
  })

  test('should set up defra-id strategy with correct configuration', async () => {
    await defraId.plugin.register(mockServer)

    const defraIdStrategyCall = mockServer.auth.strategy.mock.calls.find(
      (call) => call[0] === 'defra-id'
    )

    expect(defraIdStrategyCall).toBeDefined()
    expect(defraIdStrategyCall[1]).toBe('bell')

    const defraIdConfig = defraIdStrategyCall[2]
    const location = defraIdConfig.location

    expect(location).toBeInstanceOf(Function)

    const locationReturnValue = location(mockRequest)
    expect(locationReturnValue).toBe('https://test.defra.gov.uk/signin-oidc')
  })

  test('should set up session strategy with correct configuration', async () => {
    await defraId.plugin.register(mockServer)

    const defraIdStrategyCall = mockServer.auth.strategy.mock.calls.find(
      (call) => call[0] === 'session'
    )

    expect(defraIdStrategyCall).toBeDefined()
    expect(defraIdStrategyCall[1]).toBe('cookie')

    const defraIdConfig = defraIdStrategyCall[2]
    const validate = defraIdConfig.validate

    expect(validate).toBeInstanceOf(Function)

    const validateReturnValue = await validate(mockRequest)
    expect(validateReturnValue).toEqual({ isValid: true })

    const redirectTo = defraIdConfig.redirectTo

    expect(redirectTo).toBeInstanceOf(Function)

    const redirectToReturnValue = redirectTo(mockRequest)
    expect(redirectToReturnValue).toBe('/login')
  })

  test('should call clearExemptionCache when validity.isValid is false', async () => {
    mockedValidateUserSession.mockResolvedValue({ isValid: false })

    await defraId.plugin.register(mockServer)

    const sessionStrategyCall = mockServer.auth.strategy.mock.calls.find(
      (call) => call[0] === 'session'
    )

    const sessionConfig = sessionStrategyCall[2]
    const validate = sessionConfig.validate
    const mockSession = { userId: 'test-user' }

    const result = await validate(mockRequest, mockSession)

    expect(mockedValidateUserSession).toHaveBeenCalledWith(
      mockRequest,
      mockSession
    )
    expect(result).toEqual({ isValid: false })
    expect(mockedClearExemptionCache).toHaveBeenCalledWith(mockRequest)
  })
})
