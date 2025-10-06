import {
  COOKIE_NAMES,
  COOKIE_OPTIONS_BASE64,
  FLASH_MESSAGE_KEYS
} from '#src/server/common/constants/cookies.js'
import { getCookiePreferences } from '#src/server/common/helpers/cookie-preferences.js'
import { config } from '#src/config/config.js'

export const cookies = {
  name: 'cookie-policy',
  register(server) {
    server.state(COOKIE_NAMES.POLICY, {
      clearInvalid: true,
      encoding: COOKIE_OPTIONS_BASE64.ENCODING,
      ttl: COOKIE_OPTIONS_BASE64.TTL,
      path: COOKIE_OPTIONS_BASE64.PATH,
      isSecure: config.get('isProduction'),
      isSameSite: COOKIE_OPTIONS_BASE64.IS_SAME_SITE
    })

    // Consume flash messages early in request lifecycle (needed for redirect timing)
    server.ext('onPostAuth', (request, h) => {
      const [showCookieConfirmationBanner] = request.yar.flash(
        FLASH_MESSAGE_KEYS.SHOW_CONFIRMATION_BANNER
      )
      request.cookieConfirmationBanner = showCookieConfirmationBanner || false
      return h.continue
    })

    // Inject context for consumption by the view
    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        const cookiePolicy = getCookiePreferences(request)
        const hasSetCookiePreferences =
          request.state?.[COOKIE_NAMES.PREFERENCES_SET] === 'true'

        const showCookieBanner = !hasSetCookiePreferences
        const isOnCookiesPage = request.path === '/help/cookies'
        const currentUrl = request.path + (request.url.search || '')

        response.source.context = {
          ...response.source.context,
          showCookieConfirmationBanner: request.cookieConfirmationBanner,
          cookiePolicy,
          showCookieBanner: showCookieBanner && !isOnCookiesPage,
          currentUrl
        }
      }

      return h.continue
    })
  }
}
