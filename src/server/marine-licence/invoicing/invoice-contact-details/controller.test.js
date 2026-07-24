import { vi } from 'vitest'
import {
  invoiceContactDetailsController,
  invoiceContactDetailsSubmitController
} from '#src/server/marine-licence/invoicing/invoice-contact-details/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
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
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
      userRelationshipType: 'Agent'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#invoiceContactDetailsController', () => {
    test('Should pass isIndividual as false for a non-citizen user', async () => {
      await invoiceContactDetailsController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ isIndividual: false })
      )
    })

    test('Should pass isIndividual as true for a citizen user', async () => {
      authUtils.getUserSession.mockResolvedValue({
        userRelationshipType: 'Citizen'
      })

      await invoiceContactDetailsController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ isIndividual: true })
      )
    })
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
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should save to the backend and redirect to check invoicing details when using the change link', async () => {
      const payload = {
        fullName: 'Jane Smith',
        organisationName: 'Example Organisation',
        phoneNumber: '0191 376 2791',
        emailAddress: 'jane.smith@example.com'
      }

      authRequests.authenticatedPatchRequest.mockResolvedValue()

      await invoiceContactDetailsSubmitController.handler(
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
