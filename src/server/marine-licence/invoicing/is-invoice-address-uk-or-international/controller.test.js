import { vi } from 'vitest'
import {
  IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_VIEW_ROUTE,
  isInvoiceAddressUkOrInternationalController,
  isInvoiceAddressUkOrInternationalSubmitController
} from '#src/server/marine-licence/invoicing/is-invoice-address-uk-or-international/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'
import { isInvoiceAddressUkOrInternationalSettings } from '#src/server/common/validation/invoicing/constants.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#isInvoiceAddressUkOrInternational', () => {
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

  describe('#isInvoiceAddressUkOrInternationalController', () => {
    test('Should render page with no invoicing details in cache', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockMarineLicenceApplication,
        invoicing: undefined
      })

      await isInvoiceAddressUkOrInternationalController.handler(
        {
          query: {}
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_VIEW_ROUTE,
        {
          backLink: '/marine-licence/task-list',
          heading: isInvoiceAddressUkOrInternationalSettings.heading,
          pageTitle: isInvoiceAddressUkOrInternationalSettings.pageTitle,
          payload: {},
          projectName: mockMarineLicenceApplication.projectName
        }
      )
    })
  })

  describe('#isInvoiceAddressUkOrInternationalSubmitController', () => {
    test('Should save to cache and redirect to the same page without calling the backend', async () => {
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
          ...mockMarineLicenceApplication,
          invoicing: {
            invoiceAddressType: 'uk'
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
