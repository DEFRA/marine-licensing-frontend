import { getByRole, getByText, within } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('Marine Licence View Details', () => {
  const getServer = setupTestServer()

  test('should render the project name as the page heading', async () => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockSubmittedMarineLicenceApplication.id}`,
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      mockSubmittedMarineLicenceApplication.projectName
    )
  })

  test('should render the page in Dynamics view', async () => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${mockSubmittedMarineLicenceApplication.id}`,
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      mockSubmittedMarineLicenceApplication.projectName
    )
  })

  test('should render the public consultation row with details when consulted is yes', async () => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockSubmittedMarineLicenceApplication.id}`,
      server: getServer()
    })

    expect(
      getByText(
        document,
        'Pre-application public groups or organisations consultation'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        mockSubmittedMarineLicenceApplication.publicConsultation.details
      )
    ).toBeInTheDocument()
  })

  test('should render the public consultation row with "No" when consulted is no', async () => {
    mockMarineLicence({
      ...mockSubmittedMarineLicenceApplication,
      publicConsultation: { consulted: 'no' }
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockSubmittedMarineLicenceApplication.id}`,
      server: getServer()
    })

    const keyEl = getByText(
      document,
      'Pre-application public groups or organisations consultation'
    )
    expect(keyEl).toBeInTheDocument()
    const row = keyEl.closest('.govuk-summary-list__row')
    expect(within(row).getByText('No')).toBeInTheDocument()
  })
})
