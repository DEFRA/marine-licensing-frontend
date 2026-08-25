import Wreck from '@hapi/wreck'
import querystring from 'node:querystring'
import { config } from '#src/config/config.js'

const MILLISECONDS_PER_SECOND = 1000
// Renew a minute early so a token can't expire in flight.
const EXPIRY_SKEW_MS = 60_000
const DEFAULT_EXPIRES_IN_SECONDS = 3600

let cachedToken = null

export const resetTokenCache = () => {
  cachedToken = null
}

const buildTokenRequestBody = () => {
  const { clientId, clientSecret, clientScope } = config.get('addressLookup')

  return querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    scope: clientScope,
    grant_type: 'client_credentials'
  })
}

// Parsed by hand rather than with json: true, so a token endpoint that omits or
// mislabels its content-type still yields a token.
const parseTokenPayload = (payload) => {
  try {
    return JSON.parse(payload.toString('utf8'))
  } catch {
    return null
  }
}

const requestNewToken = async (request) => {
  const { oauthTokenUrl, timeout } = config.get('addressLookup')

  const response = await Wreck.post(oauthTokenUrl, {
    payload: buildTokenRequestBody(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout
  })

  const data = parseTokenPayload(response.payload)

  if (!data?.access_token) {
    request.logger.error(
      {
        event: { action: 'address-lookup-token-missing' },
        tenant: {
          message: `statusCode=${response.res?.statusCode} oauthTokenUrl=${oauthTokenUrl}`
        }
      },
      'Postcode lookup token response did not contain an access token'
    )
    return null
  }

  const expiresInSeconds = Number(data.expires_in) || DEFAULT_EXPIRES_IN_SECONDS

  cachedToken = {
    token: data.access_token,
    expiresAt:
      Date.now() + expiresInSeconds * MILLISECONDS_PER_SECOND - EXPIRY_SKEW_MS
  }

  return cachedToken.token
}

export const getAccessToken = async (
  request,
  { forceRefresh = false } = {}
) => {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  cachedToken = null

  try {
    return await requestNewToken(request)
  } catch (error) {
    // oauthTokenUrl is in the context because a 404 or 401 here is almost always a
    // misconfigured URL or credential rather than an outage.
    request.logger.error(
      {
        event: { action: 'address-lookup-token-failed' },
        tenant: {
          message: `statusCode=${error.output?.statusCode} oauthTokenUrl=${config.get('addressLookup').oauthTokenUrl}`
        },
        err: error
      },
      'Postcode lookup token request failed'
    )
    return null
  }
}
