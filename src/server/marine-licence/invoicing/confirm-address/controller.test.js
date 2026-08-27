import { vi } from 'vitest'
import {
  confirmAddressController,
  confirmAddressSubmitController,
  CONFIRM_ADDRESS_VIEW_ROUTE
} from '#src/server/marine-licence/invoicing/confirm-address/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import * as entryPoints from '#src/server/common/helpers/marine-licence/session-cache/invoicing-entry-points.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

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
    vi.spyOn(entryPoints, 'setInvoicingPageEntryPoint').mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#confirmAddressController', () => {
    test('Should render the selected address with the project name caption and the correct links', async () => {
      await confirmAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        CONFIRM_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          heading: 'Review and confirm',
          projectName: mockMarineLicenceApplication.projectName,
          // The lines themselves are utils.test.js's contract, and their rendering is
          // the integration test's; this only pins that they are passed through.
          addressLines: expect.any(Array),
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
      await confirmAddressController.handler(
        createMockRequest({ query: { action: 'change' } }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        CONFIRM_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          editAddressLink: `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`,
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`,
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

      await confirmAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test.each([
      ['no address has been selected', undefined],
      ['the selected address has nothing to show', {}]
    ])(
      'Should redirect back to the postcode search page when %s',
      async (_name, selected) => {
        vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
          cacheWith({ selectedInvoiceAddress: selected })
        )

        await confirmAddressController.handler(
          createMockRequest({ query: {} }),
          h
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
        )
        expect(h.view).not.toHaveBeenCalled()
      }
    )

    test('Should keep the change flow when a guard sends the user back', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({ selectedInvoiceAddress: undefined })
      )

      await confirmAddressController.handler(
        createMockRequest({ query: { action: 'change' } }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
      )
    })
  })

  describe('#confirmAddressBackLink', () => {
    test('Should go back to the postcode search even when the address was chosen from the picker', async () => {
      const request = createMockRequest({ query: {} })
      vi.spyOn(entryPoints, 'getInvoicingPageEntryPoint').mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
      )

      await confirmAddressController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        CONFIRM_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
        })
      )
    })
  })

  describe('#confirmAddressSubmitController', () => {
    const submit = (query = {}) =>
      confirmAddressSubmitController.handler(
        createMockRequest({ query, payload: {} }),
        h
      )

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

    // An address that cannot pass the manual entry rules would be rejected by the backend
    // at the end of the journey, so it is sent to the manual entry page to be corrected.
    test.each([
      [
        'the first line is longer than the manual entry page allows',
        {
          street: `${'A'.repeat(101)} STREET`,
          town: 'NEWCASTLE',
          postcode: 'NE1 1EE'
        }
      ],
      [
        'the town is longer than the manual entry page allows',
        { street: 'QUAYSIDE', town: 'B'.repeat(31), postcode: 'NE1 1EE' }
      ],
      [
        'the lookup gave no street fields at all',
        { town: 'NEWCASTLE', postcode: 'NE1 1EE' }
      ],
      [
        'the postcode is not a valid UK postcode',
        { street: 'QUAYSIDE', town: 'NEWCASTLE', postcode: 'NOT A POSTCODE' }
      ]
    ])(
      'Should go to the UK invoice address page to be corrected when %s',
      async (_name, selected) => {
        vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
          cacheWith({ selectedInvoiceAddress: selected })
        )

        await submit()

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
        )
        expect(saveInvoicingToBackend).not.toHaveBeenCalled()
      }
    )

    test('Should pre-populate the manual entry page with the address that needs correcting', async () => {
      const tooLongTown = 'B'.repeat(31)
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({
          selectedInvoiceAddress: {
            street: 'QUAYSIDE',
            town: tooLongTown,
            postcode: 'NE1 1EE'
          }
        })
      )

      await submit()

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        expect.objectContaining({
          invoicing: expect.objectContaining({
            invoiceAddress: expect.objectContaining({
              addressLine1: 'QUAYSIDE',
              addressTown: tooLongTown
            })
          })
        })
      )
    })

    test('Should send the user back to the search, not here, from the corrected address page', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({
          selectedInvoiceAddress: { town: 'NEWCASTLE', postcode: 'NE1 1EE' }
        })
      )

      await submit()

      expect(entryPoints.setInvoicingPageEntryPoint).toHaveBeenCalledWith(
        expect.anything(),
        h,
        entryPoints.INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS,
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      )
    })

    test('Should keep the change flow when sending the user to be corrected', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({
          selectedInvoiceAddress: { town: 'NEWCASTLE', postcode: 'NE1 1EE' }
        })
      )

      await submit({ action: 'change' })

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}?action=change`
      )
      expect(saveInvoicingToBackend).not.toHaveBeenCalled()
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
