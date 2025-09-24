const oneYearInDaysForSonar = 365
const oneYearInMilliseconds = 60 * 60 * 24 * oneYearInDaysForSonar * 1000

export const COOKIE_NAMES = {
  POLICY: 'cookies_policy',
  PREFERENCES_SET: 'cookies_preferences_set'
}

export const FLASH_MESSAGE_KEYS = {
  SHOW_CONFIRMATION_BANNER: 'showCookieConfirmationBanner'
}

export const COOKIE_OPTIONS = {
  TTL: oneYearInMilliseconds,
  PATH: '/',
  IS_SAME_SITE: 'Lax'
}

export const COOKIE_OPTIONS_BASE64 = {
  ...COOKIE_OPTIONS,
  ENCODING: 'base64json'
}
