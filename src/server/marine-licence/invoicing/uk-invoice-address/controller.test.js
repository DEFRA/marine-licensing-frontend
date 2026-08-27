import { vi } from 'vitest'
import {
  ukInvoiceAddressController,
  ukInvoiceAddressSubmitController,
  UK_INVOICE_ADDRESS_VIEW_ROUTE
} from '#src/server/marine-licence/invoicing/uk-invoice-address/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import * as entryPoints from '#src/server/common/helpers/marine-licence/session-cache/invoicing-entry-points.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#ukInvoiceAddress', () => {
  const h = createMockH()

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
    vi.spyOn(authRequests, 'authenticatedPatchRequest')
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#ukInvoiceAddressController', () => {
    test('Should not show a cancel link, show the correct button text and back link when using the change link', async () => {
      await ukInvoiceAddressController.handler(
        { query: { action: 'change' } },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        UK_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          cancelLink: undefined,
          buttonText: 'Save and continue',
          backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
        })
      )
    })

    test('Should link back to the postcode lookup', async () => {
      await ukInvoiceAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        UK_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          postcodeLookupLink:
            marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
        })
      )
    })

    test('Should keep the change flow in the postcode lookup link', async () => {
      await ukInvoiceAddressController.handler(
        { query: { action: 'change' } },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        UK_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          postcodeLookupLink: `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
        })
      )
    })

    test('Should default the searched postcode in when no address has been entered', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockMarineLicenceApplication,
        invoicing: {
          invoiceAddressType: 'uk',
          invoiceAddressSearch: { postcode: 'NE4 7AR' }
        }
      })

      await ukInvoiceAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        UK_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          payload: { addressPostcode: 'NE4 7AR' }
        })
      )
    })

    test('Should keep an already entered address rather than the searched postcode', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockMarineLicenceApplication,
        invoicing: {
          ...mockMarineLicenceApplication.invoicing,
          invoiceAddressSearch: { postcode: 'NE4 7AR' }
        }
      })

      await ukInvoiceAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        UK_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          payload: mockMarineLicenceApplication.invoicing.invoiceAddress
        })
      )
    })
  })

  describe('#ukInvoiceAddressBackLink', () => {
    const h = createMockH()

    beforeEach(() => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        mockMarineLicenceApplication
      )
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    test.each([
      [
        'the address picker, reached through "None of these"',
        'MARINE_LICENCE_CHOOSE_YOUR_ADDRESS'
      ],
      [
        'the postcode search, reached through "Enter the address manually"',
        'MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH'
      ]
    ])('Should go back to %s', async (_name, route) => {
      vi.spyOn(entryPoints, 'getInvoicingPageEntryPoint').mockReturnValue(
        marineLicenceRoutes[route]
      )

      await ukInvoiceAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        UK_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({ backLink: marineLicenceRoutes[route] })
      )
    })

    test('Should keep the change flow when going back mid-journey', async () => {
      vi.spyOn(entryPoints, 'getInvoicingPageEntryPoint').mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
      )

      await ukInvoiceAddressController.handler(
        createMockRequest({ query: { action: 'change' } }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        UK_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS}?action=change`
        })
      )
    })

    test('Should go back to check answers when the change link led here', async () => {
      vi.spyOn(entryPoints, 'getInvoicingPageEntryPoint').mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      )

      await ukInvoiceAddressController.handler(
        createMockRequest({ query: { action: 'change' } }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        UK_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
        })
      )
    })
  })

  describe('#ukInvoiceAddressSubmitController', () => {
    test('Should save to cache and redirect to invoice contact details without calling the backend', async () => {
      const payload = {
        addressLine1: '123 Example Street',
        addressLine2: 'Flat 2',
        addressTown: 'Exampletown',
        addressCounty: 'Exampleshire',
        addressPostcode: 'AA1 1AA'
      }

      await ukInvoiceAddressSubmitController.handler(
        {
          payload,
          query: {}
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        {
          ...mockMarineLicenceApplication,
          invoicing: {
            ...mockMarineLicenceApplication.invoicing,
            invoiceAddress: {
              ...payload
            }
          }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should save to the backend and redirect to check invoicing details when using the change link', async () => {
      authRequests.authenticatedPatchRequest.mockResolvedValue()

      const payload = {
        addressLine1: '123 Example Street',
        addressLine2: 'Flat 2',
        addressTown: 'Exampletown',
        addressCounty: 'Exampleshire',
        addressPostcode: 'AA1 1AA'
      }

      await ukInvoiceAddressSubmitController.handler(
        {
          payload,
          query: { action: 'change' }
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      )
    })
  })
})
