import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getInvoiceAddressBackLink,
  getInvoiceAddressCancelLink,
  getInvoiceAddressButtonText,
  redirectAfterInvoiceAddressSubmit
} from '#src/server/marine-licence/invoicing/utils.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js')

describe('getInvoiceAddressBackLink', () => {
  test('returns review page when action link is active', () => {
    expect(getInvoiceAddressBackLink('change')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('returns is-uk-or-international page in all other scenarios', () => {
    expect(getInvoiceAddressBackLink()).toBe(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })
})

describe('getInvoiceAddressCancelLink', () => {
  test('hides when using action link', () => {
    expect(getInvoiceAddressCancelLink('change')).toBeUndefined()
  })

  test('returns task list in all other scenarios', () => {
    expect(getInvoiceAddressCancelLink()).toBe(
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

  test('redirects to invoice contact details without saving to the backend when not using the change link', async () => {
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
