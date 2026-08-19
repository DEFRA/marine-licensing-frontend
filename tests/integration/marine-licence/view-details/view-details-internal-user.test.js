import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { expectedWaterFrameworkDirectiveCard } from './fixtures.js'
import { getAuthProvider } from '~/src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'
import { validateWaterFrameworkDirective } from '#tests/integration/shared/summary-card-validators.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Marine Licence View Details', () => {
  const getServer = setupTestServer()
  let document

  const loadViewDetailsPage = async (server) => {
    vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)

    mockMarineLicence(mockSubmittedMarineLicenceApplication)
    return loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${mockSubmittedMarineLicenceApplication.id}`,
      server
    })
  }

  beforeEach(async () => {
    document = await loadViewDetailsPage(getServer())
  })

  test('renders the page in Dynamics view', async () => {
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      mockSubmittedMarineLicenceApplication.projectName
    )
  })

  describe('site details', () => {
    test('renders the site location card', () => {
      expect(document.querySelector('#site-location-card')).not.toBeNull()
    })

    test('renders a site card for each site', () => {
      const siteCount = mockSubmittedMarineLicenceApplication.siteDetails.length
      for (let i = 1; i <= siteCount; i++) {
        expect(document.querySelector(`#site-details-${i}`)).not.toBeNull()
      }
    })

    test('does not render the internal-user-only site-details-card', () => {
      expect(document.querySelector('#site-details-card')).toBeNull()
    })
  })

  describe('hidden cards', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('does not render the fee estimate card', () => {
      expect(document.querySelector('#fee-estimate-card')).toBeNull()
    })

    test('does not render the invoicing card', () => {
      expect(document.querySelector('#invoicing-card')).toBeNull()
    })
  })

  describe('water framework directive card', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the water framework directive card', () => {
      validateWaterFrameworkDirective(
        document,
        expectedWaterFrameworkDirectiveCard
      )
    })

    test('does not render a Change link', () => {
      const card = document.querySelector('#water-framework-directive-card')
      const changeLink = card.querySelector('.govuk-summary-card__actions a')

      expect(changeLink).toBeNull()
    })
  })
})
