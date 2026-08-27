import { vi } from 'vitest'
import {
  INVOICING_ENTRY_POINT_PAGES,
  getInvoicingPageEntryPoint,
  setInvoicingPageEntryPoint
} from '#src/server/common/helpers/marine-licence/session-cache/invoicing-entry-points.js'
import { INVOICING_ENTRY_POINTS_KEY } from '#src/server/common/constants/cache.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

describe('invoicing entry points', () => {
  const h = createMockH()
  let request

  beforeEach(() => {
    request = createMockRequest()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#setInvoicingPageEntryPoint', () => {
    test('Should store the entry point for the page and commit it', async () => {
      await setInvoicingPageEntryPoint(
        request,
        h,
        INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS,
        '/marine-licence/choose-your-address'
      )

      expect(request.yar.set).toHaveBeenCalledWith(INVOICING_ENTRY_POINTS_KEY, {
        ukInvoiceAddress: '/marine-licence/choose-your-address'
      })
      expect(request.yar.commit).toHaveBeenCalledWith(h)
    })

    test('Should keep the entry points of other pages', async () => {
      request.yar.get.mockReturnValue({
        someOtherPage: '/marine-licence/check-invoicing-details'
      })

      await setInvoicingPageEntryPoint(
        request,
        h,
        INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS,
        '/marine-licence/choose-your-address'
      )

      expect(request.yar.set).toHaveBeenCalledWith(INVOICING_ENTRY_POINTS_KEY, {
        someOtherPage: '/marine-licence/check-invoicing-details',
        ukInvoiceAddress: '/marine-licence/choose-your-address'
      })
    })

    test('Should overwrite the entry point of the same page', async () => {
      request.yar.get.mockReturnValue({
        ukInvoiceAddress: '/marine-licence/invoice-address-postcode-search'
      })

      await setInvoicingPageEntryPoint(
        request,
        h,
        INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS,
        '/marine-licence/choose-your-address'
      )

      expect(request.yar.set).toHaveBeenCalledWith(INVOICING_ENTRY_POINTS_KEY, {
        ukInvoiceAddress: '/marine-licence/choose-your-address'
      })
    })
  })

  describe('#getInvoicingPageEntryPoint', () => {
    test('Should return the entry point stored for the page', () => {
      request.yar.get.mockReturnValue({
        ukInvoiceAddress: '/marine-licence/choose-your-address'
      })

      expect(
        getInvoicingPageEntryPoint(
          request,
          INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS
        )
      ).toBe('/marine-licence/choose-your-address')
    })

    test('Should return undefined when nothing is stored for the page', () => {
      request.yar.get.mockReturnValue({ someOtherPage: '/somewhere' })

      expect(
        getInvoicingPageEntryPoint(
          request,
          INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS
        )
      ).toBeUndefined()
    })

    test('Should return undefined when there is no session', () => {
      expect(
        getInvoicingPageEntryPoint(
          {},
          INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS
        )
      ).toBeUndefined()
    })
  })
})
