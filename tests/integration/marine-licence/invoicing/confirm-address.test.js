import { vi } from 'vitest'
import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { confirmAddressSettings } from '~/src/server/common/validation/invoicing/constants.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'

const selectedInvoiceAddress = {
  addressLine:
    'FLAT 3, TYNESIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE BUSINESS PARK, NEWCASTLE UPON TYNE, NE4 7AR',
  subBuildingName: 'FLAT 3',
  buildingName: 'TYNESIDE HOUSE',
  street: 'SKINNERBURN ROAD',
  locality: 'NEWCASTLE BUSINESS PARK',
  town: 'NEWCASTLE UPON TYNE',
  ceremonialCounty: 'TYNE & WEAR',
  postcode: 'NE4 7AR'
}

const mockSelectedAddress = (invoicing = {}) =>
  mockMarineLicence({
    ...mockMarineLicenceApplication,
    invoicing: {
      invoiceAddressType: 'uk',
      invoiceAddressSearch: { postcode: 'NE4 7AR' },
      selectedInvoiceAddress,
      ...invoicing
    }
  })

// The address is one paragraph with <br> between the lines, so each line is read off its
// own text node rather than out of a flattened textContent.
const addressLines = (document) =>
  [...document.querySelector('#confirm-address').childNodes]
    .filter((node) => node.nodeType === node.TEXT_NODE)
    .map((node) => node.textContent.trim())
    .filter(Boolean)

describe('Confirm address', () => {
  const getServer = setupTestServer()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('page elements', async () => {
    mockSelectedAddress()

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      confirmAddressSettings.heading
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
    )
    expect(
      getByRole(document, 'link', { name: 'Edit address' })
    ).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    getByRole(document, 'button', { name: 'Confirm address' })
  })

  test('shows the street fields on one line, then locality, town, county and postcode', async () => {
    mockSelectedAddress()

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
      server: getServer()
    })

    expect(addressLines(document)).toEqual([
      'FLAT 3 TYNESIDE HOUSE SKINNERBURN ROAD',
      'NEWCASTLE BUSINESS PARK',
      'NEWCASTLE UPON TYNE',
      'TYNE & WEAR',
      'NE4 7AR'
    ])
  })

  test('omits the fields the lookup did not provide', async () => {
    mockSelectedAddress({
      selectedInvoiceAddress: {
        addressLine: '1, QUAYSIDE, NEWCASTLE UPON TYNE, NE1 1EE',
        buildingNumber: '1',
        street: 'QUAYSIDE',
        town: 'NEWCASTLE UPON TYNE',
        postcode: 'NE1 1EE'
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
      server: getServer()
    })

    expect(addressLines(document)).toEqual([
      '1 QUAYSIDE',
      'NEWCASTLE UPON TYNE',
      'NE1 1EE'
    ])
  })

  test('page content when using the change link', async () => {
    mockSelectedAddress()

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS}?action=change`,
      server: getServer()
    })

    expect(queryByRole(document, 'link', { name: 'Cancel' })).toBeNull()
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
    expect(
      getByRole(document, 'link', { name: 'Edit address' })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
    )
  })

  test('should go to the invoice contact details page when the address is confirmed', async () => {
    mockSelectedAddress()

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
      server: getServer(),
      formData: {}
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  })

  test('should go back to the postcode search page when no address has been selected', async () => {
    mockSelectedAddress({ selectedInvoiceAddress: undefined })

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
      server: getServer(),
      formData: {}
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
    )
  })
})
