import wreck from '@hapi/wreck'
import {
  getOidcConfig,
  getOpenIdRefreshToken
} from '~/src/server/common/plugins/auth/get-oidc-config.js'

const mockPost = jest.fn()

jest.mock('@hapi/wreck', () => ({
  get: jest.fn().mockReturnValue({}),
  post: (...args) => mockPost(...args)
}))

const oidcConfigUrl =
  'http://localhost:3200/cdp-defra-id-stub/.well-known/openid-configuration'
const oidcRefreshUrl = 'https://some-token-refresh-endpoint'

describe('#getOidcConfig utils', () => {
  describe('#getOpenIdConfig', () => {
    test('Should call wreck get', async () => {
      await getOidcConfig(oidcConfigUrl)

      expect(wreck.get).toHaveBeenCalledWith(
        oidcConfigUrl,
        expect.objectContaining({
          json: true
        })
      )
    })
  })

  describe('#getOpenIdRefreshToken', () => {
    test('Should return ok response', async () => {
      mockPost.mockReturnValue({
        res: {
          statusCode: 200
        },
        payload:
          '{ "access_token": "FOO", "expires_in": 1000, "id_token": "FOO", "refresh_token": "FOO" }'
      })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getOpenIdRefreshToken(oidcRefreshUrl, params)

      expect(mockPost).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload:
            'client_id=some-client-id&client_secret=some-client-secret&grant_type=refresh_token&refresh_token=some-refresh-token&scope=some-client-id%20openid&redirect_uri=http%3A%2F%2Fsome-uri'
        })
      )
      expect(result.ok).toBeTruthy()
      expect(result.json).toEqual(
        expect.objectContaining({
          access_token: 'FOO'
        })
      )
    })

    test('Should return not ok response', async () => {
      mockPost.mockReturnValue({
        res: {
          statusCode: 500
        }
      })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getOpenIdRefreshToken(oidcRefreshUrl, params)

      expect(mockPost).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload:
            'client_id=some-client-id&client_secret=some-client-secret&grant_type=refresh_token&refresh_token=some-refresh-token&scope=some-client-id%20openid&redirect_uri=http%3A%2F%2Fsome-uri'
        })
      )
      expect(result.ok).toBeFalsy()
      expect(result).toEqual(
        expect.not.objectContaining({
          json: expect.anything()
        })
      )
    })

    test('Should return not ok response if there is an error', async () => {
      mockPost.mockReturnValue({ res: { statusCode: 200 } })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getOpenIdRefreshToken(oidcRefreshUrl, params)

      expect(result.ok).toBeFalsy()
      expect(result.error).toBeTruthy()
    })
  })

  describe('When refresh response does not contain valid JSON payload', () => {
    test.each([
      { refreshPayload: null },
      { refreshPayload: 'FOO' },
      { refreshPayload: '{}' },
      { refreshPayload: '{ "access_token": "some-token" }' },
      { refreshPayload: '{ "access_token": "FOO", "expires_in": 1000 }' },
      {
        refreshPayload:
          '{ "access_token": "FOO", "expires_in": 1000, "id_token": "FOO" }'
      }
    ])('Should return not ok response', async ({ refreshPayload }) => {
      mockPost.mockReturnValue({
        res: {
          statusCode: 200
        },
        payload: refreshPayload
      })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getOpenIdRefreshToken(oidcRefreshUrl, params)

      expect(mockPost).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload:
            'client_id=some-client-id&client_secret=some-client-secret&grant_type=refresh_token&refresh_token=some-refresh-token&scope=some-client-id%20openid&redirect_uri=http%3A%2F%2Fsome-uri'
        })
      )
      expect(result.ok).toBeFalsy()
      expect(result).toEqual(
        expect.not.objectContaining({
          json: expect.anything()
        })
      )
    })
  })
})
