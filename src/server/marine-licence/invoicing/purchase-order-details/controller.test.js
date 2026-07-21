import { vi } from 'vitest'
import {
  purchaseOrderDetailsController,
  purchaseOrderDetailsSubmitController,
  PURCHASE_ORDER_DETAILS_VIEW_ROUTE
} from '#src/server/marine-licence/invoicing/purchase-order-details/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/plugins/auth/utils.js')
vi.mock('#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js')

describe('#purchaseOrderDetails', () => {
  const h = createMockH()

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
      ...mockMarineLicenceApplication,
      invoicing: {
        invoiceAddressType: 'uk'
      }
    })
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
      userRelationshipType: 'Agent'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#purchaseOrderDetailsController', () => {
    test('Should render the page for a non-citizen user', async () => {
      await purchaseOrderDetailsController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        PURCHASE_ORDER_DETAILS_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          payload: {}
        })
      )
    })

    test('Should redirect citizens to task list without rendering the page', async () => {
      authUtils.getUserSession.mockResolvedValue({
        userRelationshipType: 'Citizen'
      })

      await purchaseOrderDetailsController.handler({ query: {} }, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
      expect(h.view).not.toHaveBeenCalled()
    })
  })

  describe('#purchaseOrderDetailsSubmitController', () => {
    test('Should save purchase order details to cache and redirect to check invoicing details', async () => {
      const payload = {
        requiresPurchaseOrder: 'yes',
        purchaseOrderNumber: 'PO-12345'
      }

      const mockRequest = { payload, query: {} }

      await purchaseOrderDetailsSubmitController.handler(
        { payload, query: {} },
        h
      )

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        {
          ...mockMarineLicenceApplication,
          invoicing: {
            invoiceAddressType: 'uk',
            purchaseOrderDetails: {
              requiresPurchaseOrder: 'yes',
              purchaseOrderNumber: 'PO-12345'
            }
          }
        }
      )

      expect(saveInvoicingToBackend).toHaveBeenCalledWith(mockRequest)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      )
    })
  })
})
