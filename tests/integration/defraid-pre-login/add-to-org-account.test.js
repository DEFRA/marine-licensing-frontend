import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'

describe('Pre-login - Employee needs to be added to org account', () => {
  const getServer = setupTestServer()

  it('should display page "You need to be added to your organisation’s Defra account"', async () => {
    const document = await loadPage({
      requestUrl: routes.preLogin.ADD_TO_ORG_ACCOUNT,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'You need to be added to your organisation’s Defra account'
    })
    expect(pageHeading).toBeInTheDocument()
    expect(
      within(document).getByRole('link', { name: 'Back' })
    ).toHaveAttribute('href', '/prelogin/check-setup-employee')
  })
})
