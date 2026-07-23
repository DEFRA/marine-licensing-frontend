import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  isInAddressTypeChangeFlow,
  isInAddressChangeFlow,
  isInChangeFlow,
  getInvoiceAddressBackLink,
  getInvoiceCancelLink,
  getInvoiceAddressButtonText,
  redirectAfterInvoiceAddressSubmit
} from '#src/server/marine-licence/invoicing/utils.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js')

describe('isInAddressTypeChangeFlow', () => {
  test('returns true when an original address type is present', () => {
    expect(
      isInAddressTypeChangeFlow({ originalInvoiceAddressType: 'uk' })
    ).toBe(true)
  })

  test('returns false when there is no original address type', () => {
    expect(isInAddressTypeChangeFlow({})).toBe(false)
  })

  test('returns false when invoicing is undefined', () => {
    expect(isInAddressTypeChangeFlow(undefined)).toBe(false)
  })
})

describe('isInAddressChangeFlow', () => {
  test('returns true when action is present', () => {
    expect(isInAddressChangeFlow('change')).toBe(true)
  })

  test('returns false when action is undefined', () => {
    expect(isInAddressChangeFlow(undefined)).toBe(false)
  })

  test('returns false when action is an empty string', () => {
    expect(isInAddressChangeFlow('')).toBe(false)
  })
})

describe('isInChangeFlow', () => {
  test('returns true when either action or an original address type is present', () => {
    expect(isInChangeFlow('change', {})).toBe(true)
    expect(
      isInChangeFlow(undefined, { originalInvoiceAddressType: 'uk' })
    ).toBe(true)
  })
})

describe('getInvoiceAddressBackLink', () => {
  test('returns review page when action link is active', () => {
    expect(getInvoiceAddressBackLink('change')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('returns correct page in all other scenarios', () => {
    expect(getInvoiceAddressBackLink()).toBe(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })
})

describe('getInvoiceCancelLink', () => {
  test('hides when using action link', () => {
    expect(getInvoiceCancelLink('change')).toBeUndefined()
  })

  test('returns task list in all other scenarios', () => {
    expect(getInvoiceCancelLink()).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})

describe('getInvoiceAddressButtonText', () => {
  test('correct for any change link', () => {
    expect(getInvoiceAddressButtonText('change')).toBe('Save and continue')
  })

  test('correct when not a change link', () => {
    expect(getInvoiceAddressButtonText()).toBe('Continue')
  })
})

describe('redirectAfterInvoiceAddressSubmit', () => {
  const h = createMockH()
  const request = {}

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('redirects to invoice contact details when not using the change link', async () => {
    await redirectAfterInvoiceAddressSubmit(request, h)

    expect(saveInvoicingToBackend).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  })

  test('saves to the backend and redirects to check invoicing details when using the change link', async () => {
    await redirectAfterInvoiceAddressSubmit(request, h, 'change')

    expect(saveInvoicingToBackend).toHaveBeenCalledWith(request)
    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })
})
