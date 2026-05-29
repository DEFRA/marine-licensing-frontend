import { JSDOM } from 'jsdom'
import { getByRole } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

const teamAdminAuth = {
  credentials: { isTeamAdmin: true }
}

const loadAdminExemptionsLandingPage = async ({ server, auth = teamAdminAuth }) => {
  const response = await makeGetRequest({
    url: routes.ADMIN_EXEMPTIONS,
    server,
    auth
  })

  return {
    response,
    document: new JSDOM(response.result).window.document
  }
}

describe('Admin exemptions landing page', () => {
  const getServer = setupTestServer()

  it('should render the page heading', async () => {
    const { response, document } = await loadAdminExemptionsLandingPage({
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Exemptions Admin'
    )
  })

  it.each([
    {
      name: 'Exemptions not sent to EMP',
      href: routes.ADMIN_EMP
    },
    {
      name: 'Exemptions without Marine Plan or Coastal Operations Areas',
      href: routes.ADMIN_BACKFILL
    },
    {
      name: 'Summary report',
      href: routes.ADMIN_REPORTS
    }
  ])(
    'should render the "$name" card link with href "$href"',
    async ({ name, href }) => {
      const { document } = await loadAdminExemptionsLandingPage({
        server: getServer()
      })

      expect(getByRole(document, 'link', { name })).toHaveAttribute('href', href)
    }
  )

  it('should return forbidden for non-team-admin users', async () => {
    const { response } = await loadAdminExemptionsLandingPage({
      server: getServer(),
      auth: { credentials: { isTeamAdmin: false } }
    })

    expect(response.statusCode).toBe(statusCodes.forbidden)
  })
})
