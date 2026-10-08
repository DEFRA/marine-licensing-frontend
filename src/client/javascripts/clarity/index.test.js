// @vitest-environment jsdom
import { vi } from 'vitest'
import Clarity from '@microsoft/clarity'
import { initClarity } from './index.js'

vi.mock('@microsoft/clarity', () => ({
  default: { init: vi.fn(), consent: vi.fn() }
}))

const setConsentGlobals = (projectId, analyticsEnabled) => {
  globalThis.CLARITY_PROJECT_ID = projectId
  globalThis.ANALYTICS_ENABLED = analyticsEnabled
}

describe('initClarity', () => {
  afterEach(() => {
    delete globalThis.CLARITY_PROJECT_ID
    delete globalThis.ANALYTICS_ENABLED
  })

  test('loads Clarity and grants consent when a project ID is set and analytics is accepted', () => {
    setConsentGlobals('abc123', true)

    expect(initClarity()).toBe(true)
    expect(Clarity.init).toHaveBeenCalledWith('abc123')
    expect(Clarity.consent).toHaveBeenCalledWith(true)
  })

  test.each([
    ['analytics is rejected', 'abc123', false],
    ['the user is undecided', 'abc123', undefined],
    ['the consent flag is not a boolean', 'abc123', 'true'],
    ['no project ID is configured', '', true],
    ['the project ID is missing', undefined, true]
  ])('does not load Clarity when %s', (_label, projectId, analyticsEnabled) => {
    setConsentGlobals(projectId, analyticsEnabled)

    expect(initClarity()).toBe(false)
    expect(Clarity.init).not.toHaveBeenCalled()
    expect(Clarity.consent).not.toHaveBeenCalled()
  })
})
