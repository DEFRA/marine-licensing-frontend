import {
  COOKIE_NAMES,
  COOKIE_OPTIONS,
  COOKIE_OPTIONS_BASE64,
  FLASH_MESSAGE_KEYS
} from '~/src/server/common/constants/cookies.js'
import { config } from '~/src/config/config.js'

export function createCookiePolicy(analytics) {
  return {
    essential: true,
    analytics,
    timestamp: Math.floor(Date.now() / 1000)
  }
}

export function setCookiePreferences(response, analytics) {
  const cookiesPolicy = createCookiePolicy(analytics)
  const isSecure = config.get('isProduction')

  response.state(COOKIE_NAMES.POLICY, cookiesPolicy, {
    encoding: COOKIE_OPTIONS_BASE64.ENCODING,
    ttl: COOKIE_OPTIONS_BASE64.TTL,
    path: COOKIE_OPTIONS_BASE64.PATH,
    isSecure,
    isSameSite: COOKIE_OPTIONS_BASE64.IS_SAME_SITE
  })

  response.state(COOKIE_NAMES.PREFERENCES_SET, 'true', {
    ttl: COOKIE_OPTIONS.TTL,
    path: COOKIE_OPTIONS.PATH,
    isSecure,
    isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
  })
}

export function setConfirmationBanner(request) {
  request.yar.flash(FLASH_MESSAGE_KEYS.SHOW_CONFIRMATION_BANNER, true)
}
