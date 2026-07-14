import { vi } from 'vitest'
import { ukInvoiceAddressSubmitController } from '#src/server/marine-licence/invoicing/uk-invoice-address/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#ukInvoiceAddress', () => {
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

  describe('#ukInvoiceAddressSubmitController', () => {
    test('Should save to cache and redirect to the same page without calling the backend', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

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
            invoiceAddressType: 'uk',
            invoiceAddress: {
              ...payload
            }
          }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
      )
      expect(h.view).not.toHaveBeenCalled()
    })
  })
})
