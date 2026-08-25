import { vi } from 'vitest'
import {
  invoiceAddressPostcodeSearchController,
  invoiceAddressPostcodeSearchSubmitController,
  INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE
} from '#src/server/marine-licence/invoicing/invoice-address-postcode-search/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as addressLookup from '#src/server/common/helpers/marine-licence/invoicing/address-lookup.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'
import {
  buildNoAddressesFoundError,
  buildLookupUnavailableError,
  buildTooManyAddressesError
} from '#src/server/marine-licence/invoicing/invoice-address-postcode-search/utils.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

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

describe('#invoiceAddressPostcodeSearch', () => {
  const h = createMockH()

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
    vi.spyOn(authRequests, 'authenticatedPatchRequest')
    vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
      results: []
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#invoiceAddressPostcodeSearchController', () => {
    test('Should render the page with the project name caption and the correct links', async () => {
      await invoiceAddressPostcodeSearchController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE,
        expect.objectContaining({
          heading: "What is the invoice contact's UK address?",
          projectName: mockMarineLicenceApplication.projectName,
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          manualEntryLink:
            marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
          buttonText: 'Continue'
        })
      )
    })

    // Prefill from the cache, the change-flow links and the non-UK redirect are asserted
    // through the rendered page in
    // tests/integration/marine-licence/invoicing/invoice-address-postcode-search.test.js
  })

  describe('#invoiceAddressPostcodeSearchSubmitController', () => {
    let logger

    const submit = (payload, query = {}) => {
      logger = { error: vi.fn(), info: vi.fn() }

      return invoiceAddressPostcodeSearchSubmitController.handler(
        { payload, query, logger },
        h
      )
    }

    test('Should look up addresses using the postcode and property name or number', async () => {
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
        results: [anAddress]
      })

      await submit({
        postcode: 'NE4 7AR',
        propertyNameOrNumber: 'Tyneside House'
      })

      expect(addressLookup.lookupAddresses).toHaveBeenCalledWith(
        expect.anything(),
        { postcode: 'NE4 7AR', propertyNameOrNumber: 'Tyneside House' }
      )
    })

    // The shape these builders produce is owned by utils.test.js; these assert only that
    // the right builder is chosen for each lookup outcome.
    test.each([
      [
        'no addresses found when there are zero results',
        { results: [] },
        buildNoAddressesFoundError
      ],
      [
        'service unavailable when the lookup fails',
        { results: [], error: true },
        buildLookupUnavailableError
      ],
      [
        'too many addresses when a filtered search hits a truncated result set',
        { results: [], truncated: true },
        buildTooManyAddressesError
      ],
      [
        'service unavailable in preference to the truncation error',
        { results: [], truncated: true, error: true },
        buildLookupUnavailableError
      ]
    ])('Should stay on the page and show %s', async (_name, lookup, build) => {
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue(lookup)

      await submit({ postcode: 'NE4 7AR', propertyNameOrNumber: 'Nowhere' })

      expect(h.view).toHaveBeenCalledWith(
        INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE,
        expect.objectContaining(build())
      )
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('Should not log the search terms or the looked up addresses', async () => {
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
        results: [anAddress]
      })

      await submit({ postcode: 'NE4 7AR', propertyNameOrNumber: 'The Mill' })

      const logged = JSON.stringify([
        ...logger.info.mock.calls,
        ...logger.error.mock.calls
      ])

      expect(logged).not.toContain('NE4 7AR')
      expect(logged).not.toContain('The Mill')
      expect(logged).not.toContain(anAddress.addressLine)
    })

    test('Should keep previously cached results when the lookup fails', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockMarineLicenceApplication,
        invoicing: {
          ...mockMarineLicenceApplication.invoicing,
          invoiceAddressSearchResults: [anAddress]
        }
      })
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
        results: [],
        error: true
      })

      await submit({ postcode: 'NE4 7AR' })

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        expect.objectContaining({
          invoicing: expect.objectContaining({
            invoiceAddressSearchResults: [anAddress]
          })
        })
      )
    })

    test('Should stay on the page without an error when there is one result', async () => {
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
        results: [anAddress]
      })

      await submit({ postcode: 'NE4 7AR' })

      expect(h.view).toHaveBeenCalledWith(
        INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE,
        expect.not.objectContaining({ errorSummary: expect.anything() })
      )
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('Should not show the truncation error when the filter still matched something', async () => {
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
        results: [anAddress],
        truncated: true
      })

      await submit({ postcode: 'NE4 7AR', propertyNameOrNumber: 'Tyneside' })

      expect(h.view).toHaveBeenCalledWith(
        INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE,
        expect.not.objectContaining({ errorSummary: expect.anything() })
      )
    })

    test('Should stay on the page without an error when there are many results', async () => {
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
        results: [anAddress, anotherAddress]
      })

      await submit({ postcode: 'NE4 7AR' })

      expect(h.view).toHaveBeenCalledWith(
        INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE,
        expect.not.objectContaining({ errorSummary: expect.anything() })
      )
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('Should save the search and its results to the cache without calling the backend', async () => {
      vi.spyOn(addressLookup, 'lookupAddresses').mockResolvedValue({
        results: [anAddress]
      })

      await submit({
        postcode: 'NE4 7AR',
        propertyNameOrNumber: 'Tyneside House'
      })

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        expect.objectContaining({
          invoicing: expect.objectContaining({
            invoiceAddressSearch: {
              postcode: 'NE4 7AR',
              propertyNameOrNumber: 'Tyneside House'
            },
            invoiceAddressSearchResults: [anAddress]
          })
        })
      )
      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
    })
  })

  describe('#failAction', () => {
    const failAction =
      invoiceAddressPostcodeSearchSubmitController.options.validate.failAction

    test('Should render the mapped error messages and keep the page links', () => {
      const err = {
        details: [{ path: ['postcode'], message: 'POSTCODE_REQUIRED' }]
      }

      failAction({ query: {}, payload: { postcode: '' } }, h, err)

      expect(h.view).toHaveBeenCalledWith(
        INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE,
        expect.objectContaining({
          errorSummary: [
            {
              href: '#postcode',
              text: 'Enter the postcode',
              field: ['postcode']
            }
          ],
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          manualEntryLink: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
        })
      )
    })
  })
})
