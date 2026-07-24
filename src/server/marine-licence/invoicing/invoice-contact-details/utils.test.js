import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { INVOICE_TYPE_OPTIONS } from '#src/server/common/validation/invoicing/constants.js'
import {
  getBackLink,
  getButtonText
} from '#src/server/marine-licence/invoicing/invoice-contact-details/utils.js'

describe('invoiceContactDetails utils', () => {
  test('returns review page when action link is active', () => {
    expect(getBackLink(INVOICE_TYPE_OPTIONS.UK, 'change')).toEqual(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

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

describe('getButtonText', () => {
  test('correct for any change link', () => {
    expect(getButtonText(true, 'change')).toBe('Save and continue')
    expect(getButtonText(false, 'change')).toBe('Save and continue')
  })

  test('correct for org users, when not a change link', () => {
    expect(getButtonText(false)).toBe('Continue')
  })
})
