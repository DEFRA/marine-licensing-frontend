import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { INVOICE_TYPE_OPTIONS } from '#src/server/common/validation/invoicing/constants.js'
import { getBackLink } from './utils.js'

describe('invoiceContactDetails utils', () => {
  test('returns UK invoice address when address type is uk', () => {
    expect(getBackLink(INVOICE_TYPE_OPTIONS.UK)).toEqual(
      marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
    )
  })

  test('returns international invoice address when address type is international', () => {
    expect(getBackLink(INVOICE_TYPE_OPTIONS.INTERNATIONAL)).toEqual(
      marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
    )
  })
})
