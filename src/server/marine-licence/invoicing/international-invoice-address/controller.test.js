import { vi } from 'vitest'
import {
  internationalInvoiceAddressController,
  internationalInvoiceAddressSubmitController,
  INTERNATIONAL_INVOICE_ADDRESS_VIEW_ROUTE
} from '#src/server/marine-licence/invoicing/international-invoice-address/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#internationalInvoiceAddress', () => {
  const h = createMockH()

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
      ...mockMarineLicenceApplication,
      invoicing: {
        invoiceAddressType: 'international'
      }
    })
    vi.spyOn(authRequests, 'authenticatedPatchRequest')
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#internationalInvoiceAddressController', () => {
    test('Should not show a cancel link, show the correct button text and back link when using the change link', async () => {
      await internationalInvoiceAddressController.handler(
        { query: { action: 'change' } },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        INTERNATIONAL_INVOICE_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          cancelLink: undefined,
          buttonText: 'Save and continue',
          backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
        })
      )
    })
  })

  describe('#internationalInvoiceAddressSubmitController', () => {
    test('Should save to cache and redirect to invoice contact details without calling the backend', async () => {
      const payload = {
        country: 'united kingdom',
        address: '123 Example Street\nExampletown\nExampleshire'
      }

      await internationalInvoiceAddressSubmitController.handler(
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
            invoiceAddressType: 'international',
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
        country: 'united kingdom',
        address: '123 Example Street\nExampletown\nExampleshire'
      }

      await internationalInvoiceAddressSubmitController.handler(
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
