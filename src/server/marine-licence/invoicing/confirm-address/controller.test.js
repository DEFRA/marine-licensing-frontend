import { vi } from 'vitest'
import {
  confirmAddressController,
  confirmAddressSubmitController,
  CONFIRM_ADDRESS_VIEW_ROUTE
} from '#src/server/marine-licence/invoicing/confirm-address/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js')

const selectedInvoiceAddress = {
  addressLine:
    'FLAT 3, TYNESIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  subBuildingName: 'FLAT 3',
  buildingName: 'TYNESIDE HOUSE',
  street: 'SKINNERBURN ROAD',
  locality: 'NEWCASTLE BUSINESS PARK',
  town: 'NEWCASTLE UPON TYNE',
  ceremonialCounty: 'TYNE & WEAR',
  postcode: 'NE4 7AR'
}

const cacheWith = (invoicing) => ({
  ...mockMarineLicenceApplication,
  invoicing: { ...mockMarineLicenceApplication.invoicing, ...invoicing }
})

describe('#confirmAddress', () => {
  const h = createMockH()

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
      cacheWith({ selectedInvoiceAddress })
    )
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#confirmAddressController', () => {
    test('Should render the selected address with the project name caption and the correct links', async () => {
      await confirmAddressController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        CONFIRM_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          heading: 'Review and confirm',
          projectName: mockMarineLicenceApplication.projectName,
          addressLines: [
            'FLAT 3 TYNESIDE HOUSE SKINNERBURN ROAD',
            'NEWCASTLE BUSINESS PARK',
            'NEWCASTLE UPON TYNE',
            'TYNE & WEAR',
            'NE4 7AR'
          ],
          editAddressLink:
            marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          buttonText: 'Confirm address'
        })
      )
    })

    test('Should go back to check answers and drop the cancel link in the change flow', async () => {
      await confirmAddressController.handler({ query: { action: 'change' } }, h)

      expect(h.view).toHaveBeenCalledWith(
        CONFIRM_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          editAddressLink: `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`,
          backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
          cancelLink: undefined,
          buttonText: 'Save and continue'
        })
      )
    })

    test('Should redirect to the UK or international page for a non-UK address', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({
          invoiceAddressType: 'international',
          selectedInvoiceAddress
        })
      )

      await confirmAddressController.handler({ query: {} }, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should redirect back to the postcode search page when no address has been selected', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({ selectedInvoiceAddress: undefined })
      )

      await confirmAddressController.handler({ query: {} }, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should keep the change flow when a guard sends the user back', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({ selectedInvoiceAddress: undefined })
      )

      await confirmAddressController.handler({ query: { action: 'change' } }, h)

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
      )
    })
  })

  describe('#confirmAddressSubmitController', () => {
    const submit = (query = {}) =>
      confirmAddressSubmitController.handler({ query, payload: {} }, h)

    test('Should save the address in the manual entry structure and continue to contact details', async () => {
      await submit()

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        expect.objectContaining({
          invoicing: expect.objectContaining({
            invoiceAddress: {
              addressLine1: 'FLAT 3 TYNESIDE HOUSE SKINNERBURN ROAD',
              addressLine2: 'NEWCASTLE BUSINESS PARK',
              addressTown: 'NEWCASTLE UPON TYNE',
              addressCounty: 'TYNE & WEAR',
              addressPostcode: 'NE4 7AR'
            }
          })
        })
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
      )
      expect(saveInvoicingToBackend).not.toHaveBeenCalled()
    })

    test('Should save to the backend and return to check answers in the change flow', async () => {
      await submit({ action: 'change' })

      expect(saveInvoicingToBackend).toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      )
    })

    test('Should redirect back to the postcode search page without saving when no address has been selected', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({ selectedInvoiceAddress: undefined })
      )

      await submit()

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      )
      expect(cacheUtils.setMarineLicenceCache).not.toHaveBeenCalled()
    })
  })
})
