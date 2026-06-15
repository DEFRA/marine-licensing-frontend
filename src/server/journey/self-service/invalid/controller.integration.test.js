import { vi } from 'vitest'

vi.mock('#src/services/iat-service/iat-context.service.js', () => ({
  iatContextService: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn()
  }
}))

const { iatContextService } =
  await import('#src/services/iat-service/iat-context.service.js')

import { JSDOM } from 'jsdom'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  setupTestServer,
  mockIatContext
} from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'

describe('#invalidController IAT timeout page (integration)', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  beforeEach(() => {
    mockIatContext(iatContextService)
  })

  const getPage = async () => {
    const response = await makeGetRequest({
      url: routes.IAT_INVALID,
      server: getServer()
    })
    return {
      response,
      document: new JSDOM(response.result).window.document
    }
  }

  test('returns 200', async () => {
    const { response } = await getPage()
    expect(response.statusCode).toBe(statusCodes.ok)
  })

  test('renders the "Your session has timed out" heading', async () => {
    const { document } = await getPage()
    expect(document.querySelector('h1').textContent).toContain(
      'Your session has timed out'
    )
  })

  test('renders the 24-hour save / resume body copy', async () => {
    const { document } = await getPage()
    expect(document.body.textContent).toContain(
      'Any answers will be saved for 24 hours. To resume, you need to go back to the start.'
    )
  })

  test('renders a "Return to start" button linking to the IAT start page', async () => {
    const { document } = await getPage()
    const button = Array.from(document.querySelectorAll('.govuk-button')).find(
      (b) => b.textContent.includes('Return to start')
    )
    expect(button).toBeTruthy()
    expect(button.getAttribute('href')).toBe(routes.IAT_START)
  })

  test('does not render the GOV.UK phase banner', async () => {
    const { document } = await getPage()
    expect(document.querySelectorAll('.govuk-phase-banner').length).toBe(0)
  })
})
