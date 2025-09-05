import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'

describe('Privacy notice page', () => {
  const getServer = setupTestServer()

  it('should display the privacy notice page', async () => {
    const document = await loadPage({
      requestUrl: routes.PRIVACY,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Privacy notice – Get permission for marine work'
    })
    expect(pageHeading).toBeInTheDocument()

    // link to the cookie page
    expect(
      within(document).getByRole('link', {
        name: 'cookies policy'
      })
    ).toHaveAttribute('href', '/help/cookies')

    // privacy link in footer
    const footer = within(document).getByRole('contentinfo')
    expect(
      within(footer).getByRole('link', {
        name: 'Privacy'
      })
    ).toHaveAttribute('href', '/help/privacy')
  })
})
