import { vi } from 'vitest'
import { isInvoiceAddressUkOrInternationalSubmitController } from '#src/server/marine-licence/invoicing/is-invoice-address-uk-or-international/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#isInvoiceAddressUkOrInternational', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id'
  }

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
    vi.spyOn(authRequests, 'authenticatedPatchRequest')
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#isInvoiceAddressUkOrInternationalSubmitController', () => {
    test('Should save to cache and redirect to the same page without calling the backend', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await isInvoiceAddressUkOrInternationalSubmitController.handler(
        {
          payload: { invoiceAddressType: 'uk' },
          query: {}
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        {
          ...mockLicence,
          invoicing: {
            invoiceAddressType: 'uk'
          }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      )
      expect(h.view).not.toHaveBeenCalled()
    })
  })
})
