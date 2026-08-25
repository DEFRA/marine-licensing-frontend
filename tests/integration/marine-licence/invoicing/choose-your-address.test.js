import { vi } from 'vitest'
import {
  getAllByRole,
  getByRole,
  getByText,
  queryByRole
} from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { chooseYourAddressSettings } from '~/src/server/common/validation/invoicing/constants.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

const anAddress = {
  addressLine: 'TYNESIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  postcode: 'NE4 7AR'
}

const anotherAddress = {
  addressLine: 'QUAYSIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  postcode: 'NE4 7AR'
}

const mockSearchResults = (
  invoiceAddressSearchResults = [anAddress, anotherAddress]
) =>
  mockMarineLicence({
    ...mockMarineLicenceApplication,
    invoicing: {
      invoiceAddressType: 'uk',
      invoiceAddressSearch: { postcode: 'NE4 7AR' },
      invoiceAddressSearchResults
    }
  })

describe('Choose your address', () => {
  const getServer = setupTestServer()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('page elements', async () => {
    mockSearchResults()

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      chooseYourAddressSettings.heading
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    getByRole(document, 'button', { name: 'Continue' })
  })

  test('lists the addresses in response order, then an "or" divider and "None of these"', async () => {
    mockSearchResults()

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
      server: getServer()
    })

    const radios = getAllByRole(document, 'radio')
    expect(
      radios.map((radio) =>
        document.querySelector(`label[for="${radio.id}"]`).textContent.trim()
      )
    ).toEqual([
      anAddress.addressLine,
      anotherAddress.addressLine,
      'None of these'
    ])
    expect(radios.map((radio) => radio.value)).toEqual(['0', '1', 'none'])

    const divider = document.querySelector('.govuk-radios__divider')
    expect(divider).toHaveTextContent('or')
    // The divider has to sit between the last address and "None of these"
    expect(divider.nextElementSibling).toContainElement(radios[2])
  })

  test('should redirect when invoice address type is not UK', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: {
        invoiceAddressType: 'international',
        invoiceAddressSearchResults: [anAddress, anotherAddress]
      }
    })

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })

  test('should redirect back to the postcode search when there is nothing to pick from', async () => {
    mockSearchResults([anAddress])

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
    )
  })

  test('page content when using the change link', async () => {
    mockSearchResults()

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS}?action=change`,
      server: getServer()
    })

    expect(queryByRole(document, 'link', { name: 'Cancel' })).toBeNull()
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('the change flow survives "None of these"', async () => {
    mockSearchResults()

    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS}?action=change`,
      server: getServer(),
      formData: { selectedAddress: 'none' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}?action=change`
    )
  })

  test('pre-selects the address chosen last time', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      invoicing: {
        invoiceAddressType: 'uk',
        invoiceAddressSearch: { postcode: 'NE4 7AR' },
        invoiceAddressSearchResults: [anAddress, anotherAddress],
        selectedInvoiceAddress: anotherAddress
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
      server: getServer()
    })

    expect(document.querySelector('input[value="1"]')).toBeChecked()
  })

  test('should show an error when nothing is selected', async () => {
    mockSearchResults()

    const { document, response } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
      server: getServer(),
      formData: {}
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(
      getByRole(document, 'link', {
        name: 'Select an address, or select "None of these"'
      })
    ).toHaveAttribute('href', '#selectedAddress')
    // The list has to survive the error re-render, or there is nothing left to pick
    expect(getAllByRole(document, 'radio')).toHaveLength(3)
  })

  test('should stay on the page when an address is selected', async () => {
    mockSearchResults()

    const { document, response } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
      server: getServer(),
      formData: { selectedAddress: '1' }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      chooseYourAddressSettings.heading
    )
    expect(document.querySelector('input[value="1"]')).toBeChecked()
  })

  test('should go to the UK invoice address page when "None of these" is selected', async () => {
    mockSearchResults()

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
      server: getServer(),
      formData: { selectedAddress: 'none' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
    )
  })
})
