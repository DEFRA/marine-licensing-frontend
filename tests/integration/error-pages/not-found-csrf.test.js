import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { config } from '~/src/config/config.js'

vi.mock('~/src/config/config.js', async () => {
  const actualConfig = await vi.importActual('~/src/config/config.js')
  return {
    config: {
      ...actualConfig.config,
      get: vi.fn((key) =>
        key === 'isTest' ? false : actualConfig.config.get(key)
      )
    }
  }
})

describe('CSRF token on the 404 page', () => {
  const getServer = setupTestServer()

  beforeEach(async () => {
    const actualConfig = await vi.importActual('~/src/config/config.js')
    config.get.mockImplementation((key) =>
      key === 'isTest' ? false : actualConfig.config.get(key)
    )
  })

  test('the cookie banner form on an unknown URL carries a CSRF token that matches the cookie', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: '/this-page-does-not-exist-for-testing'
    })

    expect(response.statusCode).toBe(statusCodes.notFound)

    const document = new JSDOM(response.result).window.document
    const tokenInput = document.querySelector(
      '.govuk-cookie-banner input[name="csrfToken"]'
    )
    expect(tokenInput).toBeInTheDocument()
    expect(tokenInput.value).not.toBe('')
    expect(String(response.headers['set-cookie'])).toContain(
      `csrfToken=${tokenInput.value}`
    )
  })
})
