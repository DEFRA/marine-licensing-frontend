import { getByRole, getByText, getByLabelText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import {
  expectInputError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { invoiceContactDetailsSettings } from '~/src/server/common/validation/invoicing/constants.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  citizenUserSession,
  agentSession
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

const mockUkInvoiceMarineLicence = {
  ...mockMarineLicenceApplication,
  invoicing: {
    invoiceAddressType: 'uk'
  }
}

const mockInternationalInvoiceMarineLicence = {
  ...mockMarineLicenceApplication,
  invoicing: {
    invoiceAddressType: 'international'
  }
}

describe('Invoice contact details', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
  })

  test('page elements', async () => {
    mockMarineLicence(mockUkInvoiceMarineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      invoiceContactDetailsSettings.heading
    )
    getByRole(document, 'button', { name: 'Continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    getByLabelText(document, 'Full name')
    getByLabelText(document, 'Organisation name')
    getByLabelText(document, 'Phone number')
    getByLabelText(document, 'Email address')
    expect(
      getByText(document, 'For international numbers include the country code')
    ).toBeInTheDocument()
  })

  test('shows "Continue" button and organisation name field for an agent', async () => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
    mockMarineLicence(mockUkInvoiceMarineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer()
    })

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
    expect(getByLabelText(document, 'Organisation name')).toBeInTheDocument()
  })

  test('shows "Save and continue" button and hides organisation name field for a citizen', async () => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)
    mockMarineLicence(mockUkInvoiceMarineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer()
    })

    getByRole(document, 'button', { name: 'Save and continue' })
    expect(document.querySelector('#organisationName')).not.toBeInTheDocument()
  })

  test('back link goes to UK invoice address when address type is uk', async () => {
    mockMarineLicence(mockUkInvoiceMarineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
    )
  })

  test('back link goes to international invoice address when address type is international', async () => {
    mockMarineLicence(mockInternationalInvoiceMarineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
    )
  })

  test('form state when no contact details set', async () => {
    mockMarineLicence(mockUkInvoiceMarineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer()
    })

    expectInputValue({
      document,
      inputLabel: 'Full name',
      value: ''
    })
    expectInputValue({
      document,
      inputLabel: 'Organisation name',
      value: ''
    })
    expectInputValue({
      document,
      inputLabel: 'Phone number',
      value: ''
    })
    expectInputValue({
      document,
      inputLabel: 'Email address',
      value: ''
    })
  })

  test('form state when contact details are set', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: {
        invoiceAddressType: 'uk',
        invoiceContactDetails: {
          fullName: 'Jane Smith',
          organisationName: 'Example Organisation',
          phoneNumber: '0191 376 2791',
          emailAddress: 'jane.smith@example.com'
        }
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer()
    })

    expectInputValue({
      document,
      inputLabel: 'Full name',
      value: 'Jane Smith'
    })
    expectInputValue({
      document,
      inputLabel: 'Organisation name',
      value: 'Example Organisation'
    })
    expectInputValue({
      document,
      inputLabel: 'Phone number',
      value: '0191 376 2791'
    })
    expectInputValue({
      document,
      inputLabel: 'Email address',
      value: 'jane.smith@example.com'
    })
  })

  test('should show validation errors when submitted empty', async () => {
    mockMarineLicence(mockUkInvoiceMarineLicence)

    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer(),
      formData: {
        fullName: '',
        organisationName: '',
        phoneNumber: '',
        emailAddress: ''
      }
    })

    expectInputError({
      document,
      inputLabel: 'Full name',
      errorMessage: 'Enter the full name'
    })
    expectInputError({
      document,
      inputLabel: 'Organisation name',
      errorMessage: 'Enter the organisation name'
    })
    expectInputError({
      document,
      inputLabel: 'Phone number',
      errorMessage: 'Enter the phone number'
    })
    expectInputError({
      document,
      inputLabel: 'Email address',
      errorMessage: 'Enter the email address'
    })
  })

  test('should not require organisation name for a citizen submitting without one', async () => {
    mockMarineLicence(mockUkInvoiceMarineLicence)

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer(),
      auth: { credentials: { userRelationshipType: 'Citizen' } },
      formData: {
        fullName: 'Jane Smith',
        organisationName: '',
        phoneNumber: '0191 376 2791',
        emailAddress: 'jane.smith@example.com'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  })

  test('should stay on the same page on valid submission', async () => {
    mockMarineLicence(mockUkInvoiceMarineLicence)

    const { response } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
      server: getServer(),
      formData: {
        fullName: 'Jane Smith',
        organisationName: 'Example Organisation',
        phoneNumber: '0191 376 2791',
        emailAddress: 'jane.smith@example.com'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  })
})
