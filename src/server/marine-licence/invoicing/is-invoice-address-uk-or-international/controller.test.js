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
          cancelLink: '/marine-licence/task-list',
          buttonText: 'Continue',
          heading: isInvoiceAddressUkOrInternationalSettings.heading,
          pageTitle: isInvoiceAddressUkOrInternationalSettings.pageTitle,
          payload: {},
          projectName: mockMarineLicenceApplication.projectName
        }
      )
      expect(cacheUtils.setMarineLicenceCache).not.toHaveBeenCalled()
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
            ...mockMarineLicenceApplication.invoicing,
            invoiceAddressType: 'uk'
          }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should save to cache and redirect to international invoice address without calling the backend', async () => {
      await isInvoiceAddressUkOrInternationalSubmitController.handler(
        {
          payload: { invoiceAddressType: 'international' },
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
            invoiceAddressType: 'international'
          }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should capture the current address type when in change flow', async () => {
      await isInvoiceAddressUkOrInternationalSubmitController.handler(
        {
          payload: { invoiceAddressType: 'international' },
          query: { action: 'change' }
        },
        h
      )

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        {
          ...mockMarineLicenceApplication,
          invoicing: {
            ...mockMarineLicenceApplication.invoicing,
            invoiceAddressType: 'international',
            originalInvoiceAddressType:
              mockMarineLicenceApplication.invoicing.invoiceAddressType
          }
        }
      )
      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
      )
    })

    test('Should capture the current address type as the original when first submitting in the change flow and the value is unchanged', async () => {
      await isInvoiceAddressUkOrInternationalSubmitController.handler(
        {
          payload: { invoiceAddressType: 'uk' },
          query: { action: 'change' }
        },
        h
      )

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        {
          ...mockMarineLicenceApplication,
          invoicing: {
            ...mockMarineLicenceApplication.invoicing,
            invoiceAddressType: 'uk',
            originalInvoiceAddressType: 'uk'
          }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      )
    })

    test('Should redirect to check invoicing details when the change link value is unchanged', async () => {
      authRequests.authenticatedPatchRequest.mockResolvedValue()
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockMarineLicenceApplication,
        invoicing: {
          ...mockMarineLicenceApplication.invoicing,
          originalInvoiceAddressType: 'uk'
        }
      })

      await isInvoiceAddressUkOrInternationalSubmitController.handler(
        {
          payload: { invoiceAddressType: 'uk' },
          query: { action: 'change' }
        },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      )
    })

    test('Should not call the backend and should redirect to the address page with the change link when the value has changed', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockMarineLicenceApplication,
        invoicing: {
          ...mockMarineLicenceApplication.invoicing,
          originalInvoiceAddressType: 'uk'
        }
      })

      await isInvoiceAddressUkOrInternationalSubmitController.handler(
        {
          payload: { invoiceAddressType: 'international' },
          query: { action: 'change' }
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS}`
      )
    })
  })
})
