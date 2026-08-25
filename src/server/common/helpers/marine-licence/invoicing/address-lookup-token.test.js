import { vi } from 'vitest'
import Wreck from '@hapi/wreck'
import querystring from 'node:querystring'
import {
  getAccessToken,
  resetTokenCache
} from '#src/server/common/helpers/marine-licence/invoicing/address-lookup-token.js'
import {
  createMockRequest,
  createWreckResponseError
} from '#src/server/test-helpers/mocks/helpers.js'
import { config } from '#src/config/config.js'

vi.mock('@hapi/wreck', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}))

const CLIENT_SECRET = config.get('addressLookup').clientSecret

const mockTokenResponse = ({
  statusCode = 200,
  body = { access_token: 'a-token', expires_in: 3600, token_type: 'Bearer' }
} = {}) => ({
  res: { statusCode },
  payload: Buffer.from(JSON.stringify(body))
})

describe('#oauthToken', () => {
  const request = createMockRequest()
  const { oauthTokenUrl, clientId, clientScope } = config.get('addressLookup')

  beforeEach(() => {
    resetTokenCache()
    Wreck.post.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('should request a token with the client credentials grant', async () => {
    Wreck.post.mockResolvedValue(mockTokenResponse())

    const token = await getAccessToken(request)

    expect(token).toBe('a-token')
    expect(Wreck.post).toHaveBeenCalledWith(oauthTokenUrl, {
      payload: expect.any(String),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: config.get('addressLookup').timeout
    })

    expect(querystring.parse(Wreck.post.mock.calls[0][1].payload)).toEqual({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: CLIENT_SECRET,
      scope: clientScope
    })
  })

  test('should reuse the cached token within its lifetime', async () => {
    Wreck.post.mockResolvedValue(mockTokenResponse())

    await getAccessToken(request)
    const token = await getAccessToken(request)

    expect(token).toBe('a-token')
    expect(Wreck.post).toHaveBeenCalledTimes(1)
  })

  test('should request a new token once the cached one has expired', async () => {
    vi.useFakeTimers()
    Wreck.post
      .mockResolvedValueOnce(
        mockTokenResponse({
          body: { access_token: 'first-token', expires_in: 120 }
        })
      )
      .mockResolvedValueOnce(
        mockTokenResponse({
          body: { access_token: 'second-token', expires_in: 120 }
        })
      )

    expect(await getAccessToken(request)).toBe('first-token')

    // 120s lifetime less the 60s renewal skew
    vi.advanceTimersByTime(61_000)

    expect(await getAccessToken(request)).toBe('second-token')
    expect(Wreck.post).toHaveBeenCalledTimes(2)
  })

  test('should bypass the cache when a refresh is forced', async () => {
    Wreck.post
      .mockResolvedValueOnce(
        mockTokenResponse({ body: { access_token: 'first-token' } })
      )
      .mockResolvedValueOnce(
        mockTokenResponse({ body: { access_token: 'second-token' } })
      )

    await getAccessToken(request)
    const token = await getAccessToken(request, { forceRefresh: true })

    expect(token).toBe('second-token')
    expect(Wreck.post).toHaveBeenCalledTimes(2)
  })

  test('should return null and log the status code when the token endpoint fails', async () => {
    Wreck.post.mockRejectedValue(createWreckResponseError(503))

    const token = await getAccessToken(request)

    expect(token).toBeNull()
    expect(request.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: { message: `statusCode=503 oauthTokenUrl=${oauthTokenUrl}` }
      }),
      'Postcode lookup token request failed'
    )
  })

  test('should log the token URL alongside the status code so a wrong URL is obvious', async () => {
    Wreck.post.mockRejectedValue(createWreckResponseError(404))

    const token = await getAccessToken(request)

    expect(token).toBeNull()
    expect(request.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: { message: `statusCode=404 oauthTokenUrl=${oauthTokenUrl}` }
      }),
      'Postcode lookup token request failed'
    )
  })

  test('should return null when the response contains no access token', async () => {
    Wreck.post.mockResolvedValue(
      mockTokenResponse({ body: { expires_in: 3600 } })
    )

    const token = await getAccessToken(request)

    expect(token).toBeNull()
    expect(request.logger.error).toHaveBeenCalledWith(
      {
        event: { action: 'address-lookup-token-missing' },
        tenant: { message: `statusCode=200 oauthTokenUrl=${oauthTokenUrl}` }
      },
      'Postcode lookup token response did not contain an access token'
    )
  })

  test('should return null when the token request throws', async () => {
    const error = new Error('network down')
    Wreck.post.mockRejectedValue(error)

    const token = await getAccessToken(request)

    expect(token).toBeNull()
    expect(request.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error }),
      'Postcode lookup token request failed'
    )
  })

  test('should not log the client secret or the access token', async () => {
    // Mint a real token first, so the token half of this assertion has teeth:
    // if the implementation logged the token anywhere, it would exist to be found.
    Wreck.post.mockResolvedValueOnce(mockTokenResponse())
    expect(await getAccessToken(request)).toBe('a-token')

    // Then force a logged failure while a token is held.
    Wreck.post.mockRejectedValueOnce(createWreckResponseError(503))
    await getAccessToken(request, { forceRefresh: true })

    const logged = JSON.stringify([
      ...request.logger.error.mock.calls,
      ...request.logger.info.mock.calls
    ])

    expect(logged).not.toContain(CLIENT_SECRET)
    expect(logged).not.toContain('a-token')
    expect(request.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: { message: `statusCode=503 oauthTokenUrl=${oauthTokenUrl}` }
      }),
      'Postcode lookup token request failed'
    )
  })
})
