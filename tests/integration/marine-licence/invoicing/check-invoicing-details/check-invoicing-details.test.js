import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import {
  validateInvoicingSummaryForIndividual,
  validateInvoicingSummaryForOrganisation
} from '~/tests/integration/marine-licence/invoicing/check-invoicing-details/check-invoicing-details.utils.js'
import { mockMarineLicenceApplication as marineLicence } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  expectedPageContentIndividual,
  expectedPageContentOrganisation
} from '~/tests/integration/marine-licence/invoicing/check-invoicing-details/check-invoicing-details.fixtures.js'
import {
  agentSession,
  citizenUserSession
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Check invoicing details', () => {
  const getServer = setupTestServer()

  test('page elements for non individual users', async () => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
      server: getServer()
    })

    expect(getByText(document, marineLicence.projectName)).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your invoicing details'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS
    )
    expect(
      queryByRole(document, 'link', { name: 'Cancel' })
    ).not.toBeInTheDocument()

    validateInvoicingSummaryForOrganisation(
      document,
      expectedPageContentOrganisation
    )

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
  })

  test('page elements for individual users', async () => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )

    validateInvoicingSummaryForIndividual(
      document,
      expectedPageContentIndividual
    )
  })

  test('back link points to task list when arriving from task list', async () => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
    mockMarineLicence(marineLicence)

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
      server: getServer(),
      headers: {
        referer: `http://example.com${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}`
      }
    })

    const { document } = new JSDOM(response.result).window

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('continue button redirects to task list', async () => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
    mockMarineLicence(marineLicence)

    const { response } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
      server: getServer(),
      formData: {}
    })

    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
