import { getByRole, queryByRole } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { config } from '~/src/config/config.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

describe('Service Home', () => {
  const getServer = setupTestServer()

  const loadServiceHomePage = () =>
    loadPage({
      requestUrl: routes.SERVICE_HOME,
      server: getServer()
    })

  describe('when marine license is disabled', () => {
    test('should render cards without Apply for Marine License tile and correct layout', async () => {
      const doc = await loadServiceHomePage()

      expect(getByRole(doc, 'heading', { level: 1 })).toHaveTextContent('Home')

      const viewProjectsLink = getByRole(doc, 'link', {
        name: /View Projects/i
      })
      expect(viewProjectsLink).toHaveAttribute('href', routes.DASHBOARD)
      expect(viewProjectsLink).toHaveClass('card')
      expect(viewProjectsLink.parentElement).toHaveClass(
        'govuk-grid-column-one-third-from-desktop'
      )
      const viewProjectsHeading = getByRole(viewProjectsLink, 'heading', {
        level: 2
      })
      expect(viewProjectsHeading).toHaveTextContent('View Projects')
      expect(viewProjectsLink).toHaveTextContent(
        'View all of the existing projects in this account.'
      )

      const checkLicenceLink = getByRole(doc, 'link', {
        name: /Check if I need a marine licence/i
      })
      expect(checkLicenceLink).toHaveAttribute(
        'href',
        'https://marinelicensing.marinemanagement.org.uk/mmofox5/journey/self-service/start'
      )
      expect(checkLicenceLink).toHaveClass('card')
      expect(checkLicenceLink.parentElement).toHaveClass(
        'govuk-grid-column-one-third-from-desktop'
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
        name: /Sign in to the Marine Case Management System/i
      })
      expect(signInLink).toHaveAttribute(
        'href',
        'https://marinelicensing.marinemanagement.org.uk/mmofox5/fox/live/MMO_LOGIN/login'
      )
      expect(signInLink).toHaveClass('card')
      expect(signInLink.parentElement).toHaveClass(
        'govuk-grid-column-one-third-from-desktop'
      )
      const signInHeading = getByRole(signInLink, 'heading', { level: 2 })
      expect(signInHeading).toHaveTextContent(
        'Sign in to the Marine Case Management System'
      )
      expect(signInLink).toHaveTextContent(
        'View or manage projects not available in this account.'
      )

      const applyForLicenseLink = queryByRole(doc, 'link', {
        name: /Apply for a Marine License/i
      })
      expect(applyForLicenseLink).toBeNull()
    })
  })

  describe('when marine license is enabled', () => {
    beforeAll(() => {
      config.set('marineLicense.enabled', true)
    })

    afterAll(() => {
      config.set('marineLicense.enabled', false)
    })

    test('should include Apply for Marine License card and use correct card layout', async () => {
      const doc = await loadServiceHomePage()

      const cards = doc.querySelectorAll('.card')
      expect(cards).toHaveLength(4)

      const applyForLicenseLink = getByRole(doc, 'link', {
        name: /Apply for a Marine License/i
      })
      expect(applyForLicenseLink).toHaveAttribute(
        'href',
        marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME
      )
      expect(applyForLicenseLink.parentElement).toHaveClass(
        'govuk-grid-column-one-half-from-desktop'
      )

      cards.forEach((card) => {
        expect(card.parentElement).toHaveClass(
          'govuk-grid-column-one-half-from-desktop'
        )
      })
    })
  })
})
