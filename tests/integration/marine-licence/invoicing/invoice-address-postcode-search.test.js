import { vi } from 'vitest'
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
import { invoiceAddressPostcodeSearchSettings } from '~/src/server/common/validation/invoicing/constants.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import * as addressLookup from '~/src/server/common/helpers/marine-licence/invoicing/address-lookup.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

const anAddress = {
  addressLine: 'TYNESIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  buildingName: 'TYNESIDE HOUSE',
  postcode: 'NE4 7AR'
}

const anotherAddress = {
  addressLine: 'QUAYSIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  buildingName: 'QUAYSIDE HOUSE',
  postcode: 'NE4 7AR'
}

describe('Invoice address postcode search', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
      results: [anAddress]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('page elements', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      invoiceAddressPostcodeSearchSettings.heading
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
    expect(
      getByRole(document, 'link', { name: 'Enter the address manually' })
    ).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    getByRole(document, 'button', { name: 'Continue' })
    getByLabelText(document, 'Postcode')
    getByLabelText(document, 'Property name or number (optional)')
    getByText(document, 'For example, The Mill, 116 or Flat 37a.')
  })

  test('should redirect when invoice address type is not UK', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: { invoiceAddressType: 'international' }
    })

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })

  test('form state when a previous search is set', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: {
        invoiceAddressType: 'uk',
        invoiceAddressSearch: {
          postcode: 'NE4 7AR',
          propertyNameOrNumber: 'Tyneside House'
        }
      }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      server: getServer()
    })

    expectInputValue({ document, inputLabel: 'Postcode', value: 'NE4 7AR' })
    expectInputValue({
      document,
      inputLabel: 'Property name or number (optional)',
      value: 'Tyneside House'
    })
  })

  test('page content when using the change link', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`,
      server: getServer()
    })

    expect(queryByRole(document, 'link', { name: 'Cancel' })).toBeNull()
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
    // The form deliberately has no action, so the browser posts back to the current URL
    // with ?action=change intact. Giving it one would drop the query string and silently
    // strip the change flow on submit.
    expect(
      document.querySelector('#postcode').closest('form')
    ).not.toHaveAttribute('action')
  })

  // One representative case: the schema rules themselves are covered exhaustively in
  // validation/invoicing/invoice-address-postcode-search/schema.test.js. This proves the
  // failAction -> view -> error summary wiring, which is identical for every rule.
  test('should show a validation error when the postcode is invalid', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      server: getServer(),
      formData: { postcode: 'not a postcode', propertyNameOrNumber: '' }
    })

    expectInputError({
      document,
      inputLabel: 'Postcode',
      errorMessage: 'Enter a valid postcode'
    })
  })

  // One representative lookup-outcome case: all three outcomes render through the same
  // buildPostcodeError -> #postcode -> error summary path, and which message is selected
  // for which outcome is covered in the controller unit tests.
  test('should show the no addresses found error when the lookup returns no results', async () => {
    mockMarineLicence(mockMarineLicenceApplication)
    vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
      results: []
    })

    const { document, response } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      server: getServer(),
      formData: { postcode: 'ZZ1 1ZZ', propertyNameOrNumber: '' }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expectInputError({
      document,
      inputLabel: 'Postcode',
      errorMessage:
        'We could not find any addresses for that postcode. Enter a known postcode, or enter the address manually.'
    })
  })

  // The other half of the above: the handler has to read the query on POST too, or the
  // links revert after a failed search even when the browser preserves the query string.
  test('should keep the change flow links after a submit', async () => {
    mockMarineLicence(mockMarineLicenceApplication)
    vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
      results: []
    })

    const { document } = await submitForm({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`,
      server: getServer(),
      formData: { postcode: 'ZZ1 1ZZ', propertyNameOrNumber: '' }
    })

    expect(queryByRole(document, 'link', { name: 'Cancel' })).toBeNull()
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('should show the service unavailable error when the lookup fails', async () => {
    mockMarineLicence(mockMarineLicenceApplication)
    vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
      results: [],
      error: true
    })

    const { document, response } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      server: getServer(),
      formData: { postcode: 'NE4 7AR', propertyNameOrNumber: '' }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expectInputError({
      document,
      inputLabel: 'Postcode',
      errorMessage:
        'There is a problem with the address lookup service. Try again later, or enter the address manually.'
    })
  })

  test('should go to the confirm address page when the lookup returns a single result', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      server: getServer(),
      formData: { postcode: 'NE4 7AR', propertyNameOrNumber: '' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS
    )
  })

  test('should go to the choose your address page when the lookup returns more than one result', async () => {
    mockMarineLicence(mockMarineLicenceApplication)
    vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
      results: [anAddress, anotherAddress]
    })

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      server: getServer(),
      formData: { postcode: 'NE4 7AR', propertyNameOrNumber: '' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
    )
  })
})
