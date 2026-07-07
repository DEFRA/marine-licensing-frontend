import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  expectedProjectDetailsCard,
  expectedOtherPermissionsCard,
  expectedWaterFrameworkDirectiveCard
} from './fixtures.js'
import { getCardRow } from './utils.js'
import { validateWaterFrameworkDirective } from '#tests/integration/shared/summary-card-validators.js'

describe('Marine Licence View Details', () => {
  const getServer = setupTestServer()

  const loadViewDetailsPage = async (server) => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)
    return loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockSubmittedMarineLicenceApplication.id}`,
      server
    })
  }

  test('renders the project name as the page heading', async () => {
    const document = await loadViewDetailsPage(getServer())

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      mockSubmittedMarineLicenceApplication.projectName
    )
  })

  describe('project details card', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the project details card', () => {
      expect(document.querySelector('#project-details-card')).not.toBeNull()
    })

    test.each(expectedProjectDetailsCard.rows)(
      'renders "$key" row with correct value',
      ({ key, value }) => {
        const card = document.querySelector('#project-details-card')
        const row = getCardRow(card, key)

        expect(row).toBeTruthy()
        expect(
          row.querySelector('.govuk-summary-list__value').textContent.trim()
        ).toBe(value)
      }
    )
  })

  describe('site details', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the site location card', () => {
      expect(document.querySelector('#site-location-card')).not.toBeNull()
    })

    test('renders a site card for each site', () => {
      const siteCount = mockSubmittedMarineLicenceApplication.siteDetails.length
      for (let i = 1; i <= siteCount; i++) {
        expect(document.querySelector(`#site-details-${i}`)).not.toBeNull()
      }
    })

    test('renders the site name', () => {
      expect(document.body.textContent).toContain(
        mockSubmittedMarineLicenceApplication.siteDetails[0].siteName
      )
    })

    test('does not render the internal-user-only site-details-card', () => {
      expect(document.querySelector('#site-details-card')).toBeNull()
    })
  })

  describe('other permissions card', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the other permissions card', () => {
      expect(document.querySelector('#other-permissions-card')).not.toBeNull()
    })

    test.each(expectedOtherPermissionsCard.rows)(
      'renders "$key" row with correct value',
      ({ key, value }) => {
        const card = document.querySelector('#other-permissions-card')
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
