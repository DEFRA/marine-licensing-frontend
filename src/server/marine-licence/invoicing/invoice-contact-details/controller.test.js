import { vi } from 'vitest'
import { invoiceContactDetailsSubmitController } from '#src/server/marine-licence/invoicing/invoice-contact-details/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#invoiceContactDetails', () => {
  const h = createMockH()

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
      ...mockMarineLicenceApplication,
      invoicing: {
        invoiceAddressType: 'uk'
      }
    })
    vi.spyOn(authRequests, 'authenticatedPatchRequest')
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#invoiceContactDetailsSubmitController', () => {
    test('Should save to cache and redirect to the same page without calling the backend', async () => {
      const payload = {
        fullName: 'Jane Smith',
        organisationName: 'Example Organisation',
        phoneNumber: '0191 376 2791',
        emailAddress: 'jane.smith@example.com'
      }

      await invoiceContactDetailsSubmitController.handler(
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
            invoiceContactDetails: {
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
  })
})
