import { getByRole } from '@testing-library/dom'
import {
  marineLicenceRoutes,
  routes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import {
  mockSubmittedMarineLicenceApplication,
  mockTransferredMarineLicenceApplication,
  mockRejectedMarineLicenceApplication
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  expectedProjectDetailsCard,
  expectedOtherPermissionsCard,
  expectedWaterFrameworkDirectiveCard,
  expectedInvocingCardIndividualUser,
  expectedInvocingCardOrgUser,
  expectedTransferredApplicationDetailsCard,
  expectedRejectedApplicationDetailsCard,
  expectedFeeEstimateCard
} from './fixtures.js'
import { getCardRow } from './utils.js'
import {
  validateInvoicingCard,
  validateWaterFrameworkDirective
} from '#tests/integration/shared/summary-card-validators.js'

describe('Marine Licence View Details', () => {
  const getServer = setupTestServer()

  const loadViewDetailsPage = async (server, marineLicenceMock) => {
    const marineLicence =
      marineLicenceMock ?? mockSubmittedMarineLicenceApplication
    mockMarineLicence(marineLicence)
    return loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicence.id}`,
      server
    })
  }

  test('renders the project name as the page heading', async () => {
    const document = await loadViewDetailsPage(getServer())

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      mockSubmittedMarineLicenceApplication.projectName
    )
  })

  test('back link goes to dashboard for submitted applications', async () => {
    const document = await loadViewDetailsPage(getServer())

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      routes.DASHBOARD
    )
  })

  test('back link goes to application transferred page for transferred applications', async () => {
    const document = await loadViewDetailsPage(
      getServer(),
      mockTransferredMarineLicenceApplication
    )

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_TRANSFERRED}/${mockTransferredMarineLicenceApplication.id}`
    )
  })

  test('back link goes to application rejected page for rejected applications', async () => {
    const document = await loadViewDetailsPage(
      getServer(),
      mockRejectedMarineLicenceApplication
    )

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${mockRejectedMarineLicenceApplication.id}`
    )
  })

  describe('application details card (transferred)', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(
        getServer(),
        mockTransferredMarineLicenceApplication
      )
    })

    test('does not render for submitted applications', async () => {
      document = await loadViewDetailsPage(getServer())

      expect(document.querySelector('#application-details-card')).toBeNull()
    })

    test('renders for transferred applications', async () => {
      expect(
        document.querySelector('#application-details-card')
      ).toBeInTheDocument()
    })

    test.each(expectedTransferredApplicationDetailsCard.rows)(
      'renders "$key" row with correct value',
      ({ key, value }) => {
        const card = document.querySelector('#application-details-card')
        const row = getCardRow(card, key)

        expect(row).toBeTruthy()
        expect(
          row.querySelector('.govuk-summary-list__value').textContent.trim()
        ).toBe(value)
      }
    )
  })

  describe('application details card (rejected)', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(
        getServer(),
        mockRejectedMarineLicenceApplication
      )
    })

    test('does not render for submitted applications', async () => {
      document = await loadViewDetailsPage(getServer())

      expect(document.querySelector('#application-details-card')).toBeNull()
    })

    test('renders for rejected applications', async () => {
      expect(
        document.querySelector('#application-details-card')
      ).toBeInTheDocument()
    })

    test.each(expectedRejectedApplicationDetailsCard.rows)(
      'renders "$key" row with correct value',
      ({ key, value }) => {
        const card = document.querySelector('#application-details-card')
        const row = getCardRow(card, key)

        expect(row).toBeTruthy()
        expect(
          row
            .querySelector('.govuk-summary-list__value')
            .textContent.replace(/\s+/g, ' ')
            .trim()
        ).toBe(value)
      }
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

  describe('fee estimate card', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the fee estimate card', () => {
      expect(document.querySelector('#fee-estimate-card')).not.toBeNull()
    })

    test.each(expectedFeeEstimateCard.rows)(
      'renders "$key" row with correct value',
      ({ key, value }) => {
        const card = document.querySelector('#fee-estimate-card')
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

  describe('invoicing card', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the invoicing card for org user', () => {
      validateInvoicingCard(document, expectedInvocingCardOrgUser)
    })

    test('renders the invoicing card for individual user', async () => {
      const mockMarineLicenceIndividualInvoice = {
        ...mockSubmittedMarineLicenceApplication
      }
      delete mockMarineLicenceIndividualInvoice.invoicing.purchaseOrderDetails
      delete mockMarineLicenceIndividualInvoice.invoicing.invoiceContactDetails
        .organisationName

      document = await loadViewDetailsPage(
        getServer(),
        mockMarineLicenceIndividualInvoice
      )

      validateInvoicingCard(document, expectedInvocingCardIndividualUser, true)
    })

    test('does not render a Change link', () => {
      const card = document.querySelector('#invoicing-card')
      const changeLink = card.querySelector('.govuk-summary-card__actions a')

      expect(changeLink).toBeNull()
    })
  })

  describe('marine plan policies card', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the marine plan policies card with the correct title', () => {
      const card = document.querySelector('#marine-plan-policies-card')
      expect(card).not.toBeNull()
      expect(
        card.querySelector('.govuk-summary-card__title').textContent.trim()
      ).toBe('Marine plan policies')
    })

    test('renders the policy code, wording and consideration', () => {
      const card = document.querySelector('#marine-plan-policies-card')
      expect(card.textContent).toContain('S-CC-1')
      expect(card.textContent).toContain('First policy wording.')
      expect(card.textContent).toContain('My first consideration.')
    })

    test('does not render a Change link for any row', () => {
      const card = document.querySelector('#marine-plan-policies-card')
      expect(
        card.querySelectorAll('.govuk-summary-list__actions a')
      ).toHaveLength(0)
      expect(card.querySelector('.govuk-summary-card__actions a')).toBeNull()
    })
  })
})
