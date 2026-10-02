// @vitest-environment jsdom
import { vi } from 'vitest'
import { initCookieConsent } from './index.js'
import { deleteAnalyticsCookies } from './analytics-cookies.js'

vi.mock('./analytics-cookies.js', () => ({
  deleteAnalyticsCookies: vi.fn()
}))

const setConsentGlobals = (preferencesSet, analyticsEnabled) => {
  globalThis.COOKIE_PREFERENCES_SET = preferencesSet
  globalThis.ANALYTICS_ENABLED = analyticsEnabled
}

describe('initCookieConsent', () => {
  afterEach(() => {
    delete globalThis.COOKIE_PREFERENCES_SET
    delete globalThis.ANALYTICS_ENABLED
  })

  test('deletes analytics cookies when the user has rejected analytics', () => {
    setConsentGlobals(true, false)

    initCookieConsent({ reload: vi.fn() })

    expect(deleteAnalyticsCookies).toHaveBeenCalledTimes(1)
  })

  test.each([
    ['the user has not decided', undefined, undefined],
    ['the user has not decided and the globals are present', false, false],
    ['the user has accepted analytics', true, true],
    ['the globals are malformed', 'true', 'false']
  ])(
    'does not delete cookies when %s',
    (_label, preferencesSet, analyticsEnabled) => {
      setConsentGlobals(preferencesSet, analyticsEnabled)

      initCookieConsent({ reload: vi.fn() })

      expect(deleteAnalyticsCookies).not.toHaveBeenCalled()
    }
  )

  test('reloads when the page is restored from the back/forward cache', () => {
    const reload = vi.fn()
    initCookieConsent({ reload })

    globalThis.dispatchEvent(
      Object.assign(new Event('pageshow'), { persisted: true })
    )

    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('does not reload on an ordinary page show', () => {
    const reload = vi.fn()
    initCookieConsent({ reload })

    globalThis.dispatchEvent(
      Object.assign(new Event('pageshow'), { persisted: false })
    )

    expect(reload).not.toHaveBeenCalled()
  })
})
