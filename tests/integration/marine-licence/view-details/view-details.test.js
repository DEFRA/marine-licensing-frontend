import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { expectedProjectDetailsCard } from './fixtures.js'

const getCardRow = (card, keyText) => {
  const rows = card.querySelectorAll('.govuk-summary-list__row')
  return [...rows].find(
    (row) =>
      row.querySelector('.govuk-summary-list__key')?.textContent.trim() ===
      keyText
  )
}

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

  test('renders the page in Dynamics view', async () => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${mockSubmittedMarineLicenceApplication.id}`,
      server: getServer()
    })

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
})
