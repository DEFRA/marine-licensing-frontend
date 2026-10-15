import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  mockMarineLicenceWithApplicationTask,
  mockApplicationTaskContactId
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: vi.fn()
}))

describe('Display a site notice page', () => {
  const getServer = setupTestServer()
  const marineLicenceId = mockMarineLicenceWithApplicationTask.id

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue(mockMarineLicenceWithApplicationTask)
    })
  })

  test('links to the site notice in a new tab from the "Get your site notice" section', async () => {
    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`,
      server: getServer()
    })
    const { document } = new JSDOM(response.result).window

    const heading = [...document.querySelectorAll('h2')].find(
      (h2) => h2.textContent === 'Get your site notice'
    )
    const link = document.querySelector(
      '[data-testid="site-notice-print-link"]'
    )

    expect(heading).toBeDefined()
    expect(link.textContent).toBe(
      'View and print the site notice (opens in new tab)'
    )
    expect(link.getAttribute('href')).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_PRINT}/${marineLicenceId}`
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })
})
