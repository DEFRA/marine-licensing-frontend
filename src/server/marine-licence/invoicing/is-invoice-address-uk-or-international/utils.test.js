import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { INVOICE_TYPE_OPTIONS } from '#src/server/common/validation/invoicing/constants.js'
import {
  getBackLink,
  getAddressRouteForType,
  isAddressTypeUnchangedSinceEnteringChangeFlow
} from '#src/server/marine-licence/invoicing/is-invoice-address-uk-or-international/utils.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('getBackLink', () => {
  test('returns review page when action link is active', () => {
    expect(getBackLink('change')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('returns task list in all other scenarios', () => {
    expect(getBackLink()).toBe(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  })
})

describe('getAddressRouteForType', () => {
  test('returns the uk invoice address route for uk', () => {
    expect(getAddressRouteForType(INVOICE_TYPE_OPTIONS.UK)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
    )
  })

  test('returns the international invoice address route for international', () => {
    expect(getAddressRouteForType(INVOICE_TYPE_OPTIONS.INTERNATIONAL)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
    )
  })
})

describe('isAddressTypeUnchangedSinceEnteringChangeFlow', () => {
  test('returns true when the submitted type matches the original', () => {
    expect(
      isAddressTypeUnchangedSinceEnteringChangeFlow(
        { originalInvoiceAddressType: 'uk' },
        'uk'
      )
    ).toBe(true)
  })

  test('returns false when the submitted type differs from the original', () => {
    expect(
      isAddressTypeUnchangedSinceEnteringChangeFlow(
        { originalInvoiceAddressType: 'uk' },
        'international'
      )
    ).toBe(false)
  })

  test('returns false when there is no original to compare against', () => {
    expect(isAddressTypeUnchangedSinceEnteringChangeFlow({}, 'uk')).toBe(false)
  })
})
