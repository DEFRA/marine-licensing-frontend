import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getBackLink } from '#src/server/marine-licence/invoicing/purchase-order-details/utils.js'

describe('getBackLink', () => {
  test('returns to review page when action link is set', () => {
    expect(getBackLink('change')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('returns to contact page in other all other scenarios', () => {
    expect(getBackLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  })
})
