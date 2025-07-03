import Wreck from '@hapi/wreck'
import { config } from '~/src/config/config.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import querystring from 'node:querystring'

export const getOidcConfig = async () => {
  const { payload } = await Wreck.get(
    config.get('defraId.oidcConfigurationUrl'),
    {
      json: true
    }
  )

  return payload
}

export const getOpenIdRefreshToken = async (refreshUrl, params) => {
  const { res, payload } = await Wreck.post(refreshUrl, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache'
    },
    payload: querystring.stringify(params)
  })

  if (res.statusCode === statusCodes.ok) {
    try {
      const jsonResponse = JSON.parse(payload.toString())

      if (
        jsonResponse?.access_token &&
        jsonResponse?.expires_in &&
        jsonResponse?.id_token &&
        jsonResponse?.refresh_token
      ) {
        return {
          ok: true,
          json: jsonResponse
        }
      }
    } catch (e) {
      return {
        ok: false,
        error: e
      }
    }
  }

  return { ok: false }
}
