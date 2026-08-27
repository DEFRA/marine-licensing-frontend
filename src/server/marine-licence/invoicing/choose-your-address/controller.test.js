import { vi } from 'vitest'
import {
  chooseYourAddressController,
  chooseYourAddressSubmitController,
  CHOOSE_YOUR_ADDRESS_VIEW_ROUTE
} from '#src/server/marine-licence/invoicing/choose-your-address/controller.js'
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

const anAddress = {
  addressLine: 'TYNESIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  postcode: 'NE4 7AR'
}

const anotherAddress = {
  addressLine: 'QUAYSIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  postcode: 'NE4 7AR'
}

const cacheWith = (invoicing) => ({
  ...mockMarineLicenceApplication,
  invoicing: { ...mockMarineLicenceApplication.invoicing, ...invoicing }
})

const withResults = (
  invoiceAddressSearchResults = [anAddress, anotherAddress]
) => cacheWith({ invoiceAddressSearchResults })

describe('#chooseYourAddress', () => {
  const h = createMockH()

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(withResults())
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
    vi.spyOn(entryPoints, 'setInvoicingPageEntryPoint').mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#chooseYourAddressController', () => {
    test('Should render the page with the project name caption and the correct links', async () => {
      await chooseYourAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        CHOOSE_YOUR_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          heading: 'Choose your address',
          projectName: mockMarineLicenceApplication.projectName,
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          buttonText: 'Continue'
        })
      )
    })

    test('Should pre-select the address chosen last time', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({
          invoiceAddressSearchResults: [anAddress, anotherAddress],
          selectedInvoiceAddress: anotherAddress
        })
      )

      await chooseYourAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        CHOOSE_YOUR_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({ payload: { selectedAddress: '1' } })
      )
    })

    test('Should select nothing when the cached address is no longer in the results', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({
          invoiceAddressSearchResults: [anAddress, anotherAddress],
          selectedInvoiceAddress: { addressLine: 'SOMEWHERE ELSE' }
        })
      )

      await chooseYourAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        CHOOSE_YOUR_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({ payload: {} })
      )
    })

    test('Should keep the change flow when a guard sends the user back', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({ invoiceAddressSearchResults: [anAddress] })
      )

      await chooseYourAddressController.handler(
        { query: { action: 'change' } },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
      )
    })

    test('Should redirect to the UK or international page for a non-UK address', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({
          invoiceAddressType: 'international',
          invoiceAddressSearchResults: [anAddress, anotherAddress]
        })
      )

      await chooseYourAddressController.handler(
        createMockRequest({ query: {} }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test.each([
      ['there are no cached results', undefined],
      ['there is only one cached result', [anAddress]]
    ])(
      'Should redirect back to the postcode search page when %s',
      async (_name, invoiceAddressSearchResults) => {
        vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
          cacheWith({ invoiceAddressSearchResults })
        )

        await chooseYourAddressController.handler(
          createMockRequest({ query: {} }),
          h
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
        )
        expect(h.view).not.toHaveBeenCalled()
      }
    )
  })

  describe('#chooseYourAddressEntryPoints', () => {
    test('Should record itself as the page behind the UK address page, for "None of these"', async () => {
      const request = createMockRequest({ query: {} })

      await chooseYourAddressController.handler(request, h)

      expect(entryPoints.setInvoicingPageEntryPoint).toHaveBeenCalledWith(
        request,
        h,
        entryPoints.INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS,
        marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
      )
    })

    test('Should record itself as the page behind the confirm address page', async () => {
      const request = createMockRequest({
        payload: { selectedAddress: '1' },
        query: {}
      })

      await chooseYourAddressSubmitController.handler(request, h)

      expect(entryPoints.setInvoicingPageEntryPoint).toHaveBeenCalledWith(
        request,
        h,
        entryPoints.INVOICING_ENTRY_POINT_PAGES.CONFIRM_ADDRESS,
        marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
      )
    })
  })

  describe('#chooseYourAddressSubmitController', () => {
    const submit = (selectedAddress, query = {}) =>
      chooseYourAddressSubmitController.handler(
        createMockRequest({ payload: { selectedAddress }, query }),
        h
      )

    test('Should go to the confirm address page when an address is chosen', async () => {
      await submit('1')

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should keep the change flow on the way to the confirm address page', async () => {
      await submit('1', { action: 'change' })

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS}?action=change`
      )
    })

    test('Should cache the chosen address without calling the backend', async () => {
      await submit('1')

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.anything(),
        h,
        expect.objectContaining({
          invoicing: expect.objectContaining({
            selectedInvoiceAddress: anotherAddress
          })
        })
      )
      expect(saveInvoicingToBackend).not.toHaveBeenCalled()
    })

    test('Should go to the UK invoice address page when "None of these" is chosen', async () => {
      await submit('none')

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
      )
      expect(cacheUtils.setMarineLicenceCache).not.toHaveBeenCalled()
    })

    test('Should redirect back to the postcode search page for a selection outside the results', async () => {
      await submit('7')

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      )
      expect(cacheUtils.setMarineLicenceCache).not.toHaveBeenCalled()
    })

    test('Should redirect back to the postcode search page when the results are gone', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({ invoiceAddressSearchResults: undefined })
      )

      await submit('0')

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      )
    })
  })

  describe('#failAction', () => {
    const failAction =
      chooseYourAddressSubmitController.options.validate.failAction

    test('Should redirect instead of re-rendering an empty picker when the results are gone', () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(
        cacheWith({ invoiceAddressSearchResults: undefined })
      )

      failAction(createMockRequest({ query: {}, payload: {} }), h, {
        details: []
      })

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should show the selection error and keep the address list', () => {
      const err = {
        details: [
          { path: ['selectedAddress'], message: 'SELECTED_ADDRESS_REQUIRED' }
        ]
      }

      failAction(createMockRequest({ query: {}, payload: {} }), h, err)

      expect(h.view).toHaveBeenCalledWith(
        CHOOSE_YOUR_ADDRESS_VIEW_ROUTE,
        expect.objectContaining({
          errorSummary: [
            {
              href: '#selectedAddress',
              text: 'Select an address, or select "None of these"',
              field: ['selectedAddress']
            }
          ],
          items: [
            { value: '0', text: anAddress.addressLine },
            { value: '1', text: anotherAddress.addressLine },
            { divider: 'or' },
            { value: 'none', text: 'None of these' }
          ],
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      )
    })
  })
})
