import { getBackLink } from '#src/server/marine-licence/invoicing/check-invoicing-details/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
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
