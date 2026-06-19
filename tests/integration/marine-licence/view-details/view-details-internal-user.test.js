import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  expectedSiteDetailsCard,
  expectedWaterFrameworkDirectiveCard
} from './fixtures.js'
import { getCardRow } from './utils.js'
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

  describe('site details card', () => {
    test('renders the site details card', () => {
      expect(document.querySelector('#site-details-card')).not.toBeNull()
    })

    test.each(expectedSiteDetailsCard.rows)(
      'renders "$key" row with correct value',
      ({ key, value }) => {
        const card = document.querySelector('#site-details-card')
        const row = getCardRow(card, key)

        expect(row).toBeTruthy()
        expect(
          row.querySelector('.govuk-summary-list__value').textContent.trim()
        ).toBe(value)
      }
    )
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
