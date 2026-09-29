import { vi } from 'vitest'
import {
  sanitiseGoogleTagManagerKey,
  warnIfAnalyticsIdsMissing
} from './analytics-config.js'

const fakeConfig = (values) => ({
  get: vi.fn((key) => values[key]),
  set: vi.fn((key, value) => {
    values[key] = value
  })
})

describe('sanitiseGoogleTagManagerKey', () => {
  let warnSpy

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  test('keeps a valid container ID', () => {
    const config = fakeConfig({ googleTagManagerKey: 'GTM-ABC1234' })

    sanitiseGoogleTagManagerKey(config)

    expect(config.set).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('keeps an empty value without warning', () => {
    const config = fakeConfig({ googleTagManagerKey: '' })

    sanitiseGoogleTagManagerKey(config)

    expect(config.set).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('trims surrounding whitespace from a valid container ID', () => {
    const config = fakeConfig({ googleTagManagerKey: ' GTM-ABC1234\n' })

    sanitiseGoogleTagManagerKey(config)

    expect(config.set).toHaveBeenCalledWith(
      'googleTagManagerKey',
      'GTM-ABC1234'
    )
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('treats a whitespace-only value as empty without warning', () => {
    const config = fakeConfig({ googleTagManagerKey: '  ' })

    sanitiseGoogleTagManagerKey(config)

    expect(config.set).toHaveBeenCalledWith('googleTagManagerKey', '')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test.each([
    'not-a-real-ga4-container-id',
    'gtm-lowercase1',
    'GTM-',
    'G-ABC123'
  ])('blanks the invalid value %s and warns', (value) => {
    const config = fakeConfig({ googleTagManagerKey: value })

    sanitiseGoogleTagManagerKey(config)

    expect(config.set).toHaveBeenCalledWith('googleTagManagerKey', '')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('GOOGLE_TAG_MANAGER_KEY')
    )
  })
})

describe('warnIfAnalyticsIdsMissing', () => {
  let warnSpy

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  test('warns for Clarity and GTM in prod when both are missing', () => {
    const config = fakeConfig({
      cdpEnvironment: 'prod',
      clarityProjectId: '',
      googleTagManagerKey: ''
    })

    warnIfAnalyticsIdsMissing(config)

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'CLARITY_PROJECT_ID is not set for prod environment'
      )
    )
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'GOOGLE_TAG_MANAGER_KEY is not set for prod environment'
      )
    )
  })

  test('warns for Clarity but not GTM in perf-test', () => {
    const config = fakeConfig({
      cdpEnvironment: 'perf-test',
      clarityProjectId: '',
      googleTagManagerKey: ''
    })

    warnIfAnalyticsIdsMissing(config)

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('CLARITY_PROJECT_ID')
    )
  })

  test.each(['local', 'dev', 'test', 'ext-test'])(
    'does not warn in %s',
    (environment) => {
      const config = fakeConfig({
        cdpEnvironment: environment,
        clarityProjectId: '',
        googleTagManagerKey: ''
      })

      warnIfAnalyticsIdsMissing(config)

      expect(warnSpy).not.toHaveBeenCalled()
    }
  )

  test('does not warn when both IDs are set in prod', () => {
    const config = fakeConfig({
      cdpEnvironment: 'prod',
      clarityProjectId: 'abc',
      googleTagManagerKey: 'GTM-ABC1234'
    })

    warnIfAnalyticsIdsMissing(config)

    expect(warnSpy).not.toHaveBeenCalled()
  })
})
