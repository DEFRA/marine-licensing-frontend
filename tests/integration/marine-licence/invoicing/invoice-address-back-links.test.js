import { vi } from 'vitest'
import { getByRole } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import * as addressLookup from '~/src/server/common/helpers/marine-licence/invoicing/address-lookup.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

const anAddress = {
  addressLine: 'TYNESIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  buildingName: 'TYNESIDE HOUSE',
  street: 'SKINNERBURN ROAD',
  town: 'NEWCASTLE UPON TYNE',
  postcode: 'NE4 7AR'
}

const anotherAddress = {
  ...anAddress,
  addressLine: 'QUAYSIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  buildingName: 'QUAYSIDE HOUSE'
}

const invoicingCache = (invoicing) =>
  mockMarineLicence({
    ...mockMarineLicenceApplication,
    invoicing: {
      invoiceAddressType: 'uk',
      invoiceAddressSearch: { postcode: 'NE4 7AR' },
      ...invoicing
    }
  })

// The entry point that decides these back links lives in the session, so the journey
// only holds together while the session cookie is carried from one request to the next.
const sessionCookie = (response) => {
  const cookie = response.headers['set-cookie']
  return Array.isArray(cookie) ? cookie.join('; ') : cookie
}

describe('Invoice address back links', () => {
  const getServer = setupTestServer()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const backLinkOf = async (url, cookie) => {
    const response = await makeGetRequest({
      url,
      server: getServer(),
      headers: { cookie }
    })
    const { document } = new JSDOM(response.result).window

    return getByRole(document, 'link', { name: 'Back' }).getAttribute('href')
  }

  describe('the UK address page', () => {
    test('goes back to the address picker when "None of these" led there', async () => {
      invoicingCache({
        invoiceAddressSearchResults: [anAddress, anotherAddress]
      })

      const picker = await makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
        server: getServer()
      })

      expect(
        await backLinkOf(
          marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
          sessionCookie(picker)
        )
      ).toBe(marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS)
    })

    test('keeps the change flow when going back to the address picker', async () => {
      invoicingCache({
        invoiceAddressSearchResults: [anAddress, anotherAddress]
      })

      const picker = await makeGetRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS}?action=change`,
        server: getServer()
      })

      expect(
        await backLinkOf(
          `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}?action=change`,
          sessionCookie(picker)
        )
      ).toBe(
        `${marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS}?action=change`
      )
    })

    test('goes back to the postcode search when "Enter the address manually" led there', async () => {
      invoicingCache({})

      const search = await makeGetRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`,
        server: getServer()
      })

      expect(
        await backLinkOf(
          `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}?action=change`,
          sessionCookie(search)
        )
      ).toBe(
        `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
      )
    })

    test('goes back to the postcode search when a looked up address was sent to be corrected', async () => {
      invoicingCache({
        selectedInvoiceAddress: { town: 'NEWCASTLE', postcode: 'NE1 1EE' }
      })

      const rejected = await makePostRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS}?action=change`,
        server: getServer(),
        formData: {}
      })

      expect(rejected.headers.location).toBe(
        `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}?action=change`
      )
      expect(
        await backLinkOf(
          `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}?action=change`,
          sessionCookie(rejected)
        )
      ).toBe(
        `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
      )
    })
  })

  describe('the confirm address page', () => {
    test('goes back to the address picker when an address was chosen there', async () => {
      invoicingCache({
        invoiceAddressSearchResults: [anAddress, anotherAddress],
        selectedInvoiceAddress: anAddress
      })

      const chosen = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
        server: getServer(),
        formData: { selectedAddress: '0' }
      })

      expect(
        await backLinkOf(
          marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
          sessionCookie(chosen)
        )
      ).toBe(marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS)
    })

    test('goes back to the postcode search when a single result led there', async () => {
      invoicingCache({ selectedInvoiceAddress: anAddress })
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
        results: [anAddress]
      })

      const searched = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
        server: getServer(),
        formData: { postcode: 'NE4 7AR', propertyNameOrNumber: '' }
      })

      expect(searched.headers.location).toBe(
        marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS
      )

      expect(
        await backLinkOf(
          marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
          sessionCookie(searched)
        )
      ).toBe(marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH)
    })
  })
})
