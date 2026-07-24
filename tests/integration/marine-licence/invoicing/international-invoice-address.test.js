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
import { internationalInvoiceAddressSettings } from '~/src/server/common/validation/invoicing/constants.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

const mockInternationalMarineLicence = {
  ...mockMarineLicenceApplication,
  invoicing: {
    invoiceAddressType: 'international'
  }
}

describe('International invoice address', () => {
  const getServer = setupTestServer()

  test('page elements', async () => {
    mockMarineLicence(mockInternationalMarineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
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
      internationalInvoiceAddressSettings.heading
    )
    getByRole(document, 'button', { name: 'Continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    getByLabelText(document, 'Country')
    getByLabelText(document, 'Address')
    expect(
      document.querySelector('[data-module="app-accessible-autocomplete"]')
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'Start typing the name of a country to filter the list'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'Enter the full address including any region or state'
      )
    ).toBeInTheDocument()
  })

  test('form state when no address set', async () => {
    mockMarineLicence(mockInternationalMarineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
      server: getServer()
    })

    expectInputValue({
      document,
      inputLabel: 'Country',
      value: ''
    })
    expectInputValue({
      document,
      inputLabel: 'Address',
      value: ''
    })
  })

  test('should redirect when invoice address type is not international', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: { invoiceAddressType: 'uk' }
    })

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
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
        invoiceAddressType: 'international',
        invoiceAddress: {
          country: 'United Kingdom',
          address: '123 Example Street Exampletown'
        }
      }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
      server: getServer()
    })

    expectInputValue({
      document,
      inputLabel: 'Country',
      value: 'United Kingdom'
    })
    expectInputValue({
      document,
      inputLabel: 'Address',
      value: '123 Example Street Exampletown'
    })
  })

  test('should show validation errors when submitted empty', async () => {
    mockMarineLicence(mockInternationalMarineLicence)

    const { document } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
      server: getServer(),
      formData: {
        country: '',
        address: ''
      }
    })

    expectInputError({
      document,
      inputLabel: 'Country',
      errorMessage: 'Select the country'
    })
    expectInputError({
      document,
      inputLabel: 'Address',
      errorMessage: 'Enter the address'
    })
  })

  test('should redirect to invoice contact details on valid submission', async () => {
    mockMarineLicence(mockInternationalMarineLicence)

    const { response } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
      server: getServer(),
      formData: {
        country: 'United Kingdom',
        address: '123 Example Street Exampletown'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  })

  test('when using the change link, hides the cancel link, shows "Save and continue" and back links to check invoicing details', async () => {
    mockMarineLicence(mockInternationalMarineLicence)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS}?action=change`,
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
      ...mockInternationalMarineLicence,
      invoicing: {
        ...mockInternationalMarineLicence.invoicing,
        originalInvoiceAddressType: 'uk'
      }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })

  test('should redirect to check invoicing details on valid submission when using the change link', async () => {
    mockMarineLicence(mockInternationalMarineLicence)

    const { response } = await submitForm({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS}?action=change`,
      server: getServer(),
      formData: {
        country: 'United Kingdom',
        address: '123 Example Street Exampletown'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })
})
