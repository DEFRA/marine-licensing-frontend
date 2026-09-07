import {
  getAddressChangeRoute,
  getBackLink
} from '#src/server/marine-licence/invoicing/check-invoicing-details/utils.js'
import {
  marineLicenceInvoicingRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  ADDRESS_SOURCE,
  INVOICE_TYPE_OPTIONS
} from '#src/server/common/validation/invoicing/constants.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

describe('getBackLink', () => {
  const mockRequest = createMockRequest()

  test('returns check-your-answers link when returnTo session value is set', () => {
    const mockRequestFromCYA = createMockRequest()
    mockRequestFromCYA.yar.get.mockReturnValue(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )

    expect(getBackLink(mockRequestFromCYA, false)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#invoicing-card`
    )
  })

  test('returns contact details link for individual users', () => {
    expect(getBackLink(mockRequest, true)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  })

  test('returns purchase order details link for organisation users', () => {
    expect(getBackLink(mockRequest, false)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS
    )
  })

  test('returns task-list link when previous page is task list', () => {
    const mockRequestFromTaskList = createMockRequest({
      headers: {
        referer: `http://example.com${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}`
      }
    })

    expect(getBackLink(mockRequestFromTaskList, false)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})

describe('getAddressChangeRoute', () => {
  test('returns the postcode search for a UK address provided by lookup', () => {
    expect(
      getAddressChangeRoute({
        invoiceAddressType: INVOICE_TYPE_OPTIONS.UK,
        invoiceAddressSource: ADDRESS_SOURCE.LOOKUP
      })
    ).toBe(
      marineLicenceInvoicingRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
    )
  })

  test('returns the manual entry page for a UK address entered manually', () => {
    expect(
      getAddressChangeRoute({
        invoiceAddressType: INVOICE_TYPE_OPTIONS.UK,
        invoiceAddressSource: ADDRESS_SOURCE.MANUAL
      })
    ).toBe(marineLicenceInvoicingRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS)
  })

  test('returns the manual entry page for a UK address with no recorded source', () => {
    expect(
      getAddressChangeRoute({ invoiceAddressType: INVOICE_TYPE_OPTIONS.UK })
    ).toBe(marineLicenceInvoicingRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS)
  })

  test('returns the international address page for an international address', () => {
    expect(
      getAddressChangeRoute({
        invoiceAddressType: INVOICE_TYPE_OPTIONS.INTERNATIONAL,
        invoiceAddressSource: ADDRESS_SOURCE.LOOKUP
      })
    ).toBe(
      marineLicenceInvoicingRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
    )
  })

  test('returns the UK or international question when no address type has been chosen', () => {
    expect(getAddressChangeRoute(undefined)).toBe(
      marineLicenceInvoicingRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
    expect(getAddressChangeRoute({})).toBe(
      marineLicenceInvoicingRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })
})
