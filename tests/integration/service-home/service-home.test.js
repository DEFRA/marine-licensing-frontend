import { getByRole } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'

describe('Service Home', () => {
  const getServer = setupTestServer()

  const loadServiceHomePage = () =>
    loadPage({
      requestUrl: routes.SERVICE_HOME,
      server: getServer()
    })

  it('should render the service home page with heading and cards', async () => {
    const doc = await loadServiceHomePage()

    expect(getByRole(doc, 'heading', { level: 1 })).toHaveTextContent('Home')

    const viewProjectsLink = getByRole(doc, 'link', {
      name: 'View Projects'
    })
    expect(viewProjectsLink).toHaveAttribute('href', routes.DASHBOARD)
    expect(viewProjectsLink).toHaveClass('card')
    expect(viewProjectsLink).toHaveAttribute('aria-label', 'View Projects')
    const viewProjectsHeading = getByRole(viewProjectsLink, 'heading', {
      level: 2
    })
    expect(viewProjectsHeading).toHaveTextContent('View Projects')
    expect(viewProjectsLink).toHaveTextContent(
      'View all of the existing projects in this account.'
    )

    const checkLicenceLink = getByRole(doc, 'link', {
      name: 'Check if I need a marine licence'
    })
    expect(checkLicenceLink).toHaveAttribute(
      'href',
      'https://marinelicensing.marinemanagement.org.uk/mmofox5/journey/self-service/start'
    )
    expect(checkLicenceLink).toHaveClass('card')
    expect(checkLicenceLink).toHaveAttribute(
      'aria-label',
      'Check if I need a marine licence'
    )
    const checkLicenceHeading = getByRole(checkLicenceLink, 'heading', {
      level: 2
    })
    expect(checkLicenceHeading).toHaveTextContent(
      'Check if I need a marine licence'
    )
    expect(checkLicenceLink).toHaveTextContent(
      "Find out if an activity needs a marine licence or if it's exempt."
    )

    const signInLink = getByRole(doc, 'link', {
      name: 'Sign in to the Marine Case Management System'
    })
    expect(signInLink).toHaveAttribute(
      'href',
      'https://marinelicensing.marinemanagement.org.uk/mmofox5/fox/live/MMO_LOGIN/login'
    )
    expect(signInLink).toHaveClass('card')
    expect(signInLink).toHaveAttribute(
      'aria-label',
      'Sign in to the Marine Case Management System'
    )
    const signInHeading = getByRole(signInLink, 'heading', { level: 2 })
    expect(signInHeading).toHaveTextContent(
      'Sign in to the Marine Case Management System'
    )
    expect(signInLink).toHaveTextContent(
      'View or manage projects not available in this account.'
    )
  })
})
