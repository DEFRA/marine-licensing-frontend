import {
  getByRole,
  getByText,
  getByLabelText,
  queryByRole
} from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import {
  expectInputError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { ukInvoiceAddressSettings } from '~/src/server/common/validation/invoicing/constants.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

describe('UK invoice address', () => {
  const getServer = setupTestServer()

  test('page elements', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      ukInvoiceAddressSettings.heading
    )
    getByRole(document, 'button', { name: 'Continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    getByLabelText(document, 'Address line 1')
    getByLabelText(document, 'Address line 2 (optional)')
    getByLabelText(document, 'Town or city')
    getByLabelText(document, 'County (optional)')
    getByLabelText(document, 'Postcode')
  })

  test('form state when no address set', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: { invoiceAddressType: 'uk' }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
      server: getServer()
    })

    expectInputValue({
      document,
      inputLabel: 'Address line 1',
      value: ''
    })
    expectInputValue({
      document,
      inputLabel: 'Address line 2 (optional)',
      value: ''
    })
    expectInputValue({
      document,
      inputLabel: 'Town or city',
      value: ''
    })
    expectInputValue({
      document,
      inputLabel: 'County (optional)',
      value: ''
    })
    expectInputValue({
      document,
      inputLabel: 'Postcode',
      value: ''
    })
  })

  test('should redirect when invoice address type is not UK', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: { invoiceAddressType: 'international' }
    })

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })

  test('form state when address is set', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: {
        ...mockMarineLicenceApplication.invoicing,
        invoiceAddress: {
          addressLine1: '123 Example Street',
          addressLine2: 'Flat 2',
          addressTown: 'Exampletown',
          addressCounty: 'Exampleshire',
          addressPostcode: 'AA1 1AA'
        }
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
      server: getServer()
    })

    expectInputValue({
      document,
      inputLabel: 'Address line 1',
      value: '123 Example Street'
    })
    expectInputValue({
      document,
      inputLabel: 'Address line 2 (optional)',
      value: 'Flat 2'
    })
    expectInputValue({
      document,
      inputLabel: 'Town or city',
      value: 'Exampletown'
    })
    expectInputValue({
      document,
      inputLabel: 'County (optional)',
      value: 'Exampleshire'
    })
    expectInputValue({
      document,
      inputLabel: 'Postcode',
      value: 'AA1 1AA'
    })
  })

  test('should show validation errors when submitted empty', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
      server: getServer(),
      formData: {
        addressLine1: '',
        addressLine2: '',
        addressTown: '',
        addressCounty: '',
        addressPostcode: ''
      }
    })

    expectInputError({
      document,
      inputLabel: 'Address line 1',
      errorMessage: 'Enter the first line of the address'
    })
    expectInputError({
      document,
      inputLabel: 'Town or city',
      errorMessage: 'Enter the town or city'
    })
    expectInputError({
      document,
      inputLabel: 'Postcode',
      errorMessage: 'Enter the postcode'
    })
  })

  test('should redirect to invoice contact details on valid submission', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { response } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
      server: getServer(),
      formData: {
        addressLine1: '123 Example Street',
        addressLine2: '',
        addressTown: 'Exampletown',
        addressCounty: '',
        addressPostcode: 'AA1 1AA'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  })

  test('page content when using change link', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}?action=change`,
      server: getServer()
    })

    expect(queryByRole(document, 'link', { name: 'Cancel' })).toBeNull()
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('page content when using change link flow from address type page', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: {
        ...mockMarineLicenceApplication.invoicing,
        originalInvoiceAddressType: 'international'
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })

  test('should redirect to check invoicing details on valid submission when using the change link', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { response } = await submitForm({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}?action=change`,
      server: getServer(),
      formData: {
        addressLine1: '123 Example Street',
        addressLine2: '',
        addressTown: 'Exampletown',
        addressCounty: '',
        addressPostcode: 'AA1 1AA'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })
})
