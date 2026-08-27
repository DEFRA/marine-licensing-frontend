import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { INVOICE_TYPE_OPTIONS } from '#src/server/common/validation/invoicing/constants.js'
import {
  isInAddressTypeChangeFlow,
  isInAddressChangeFlow,
  isInChangeFlow,
  getInvoiceAddressBackLink,
  getUkInvoiceAddressBackLink,
  getConfirmAddressBackLink,
  getInvoiceCancelLink,
  getInvoiceAddressButtonText,
  redirectAfterInvoiceAddressSubmit,
  withAction,
  getMissingPrerequisiteRedirect,
  hasPickableResults,
  hasSingleResult
} from '#src/server/marine-licence/invoicing/utils.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import { INVOICING_ENTRY_POINTS_KEY } from '#src/server/common/constants/cache.js'
import { INVOICING_ENTRY_POINT_PAGES } from '#src/server/common/helpers/marine-licence/session-cache/invoicing-entry-points.js'

vi.mock('#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js')

const searchResults = [
  { addressLine: '1 HIGH STREET, LONDON, SW1 2AA' },
  { addressLine: '2 HIGH STREET, LONDON, SW1 2AA' }
]

describe('#hasPickableResults', () => {
  test.each([
    ['there are no results', []],
    ['there is a single result', [searchResults[0]]]
  ])('Should be false when %s', (_name, results) => {
    expect(hasPickableResults(results)).toBe(false)
  })

  test('Should be true when there is more than one result', () => {
    expect(hasPickableResults(searchResults)).toBe(true)
  })
})

describe('#hasSingleResult', () => {
  test.each([
    ['there are no results', []],
    ['there is more than one result', searchResults]
  ])('Should be false when %s', (_name, results) => {
    expect(hasSingleResult(results)).toBe(false)
  })

  test('Should be true when there is exactly one result', () => {
    expect(hasSingleResult([searchResults[0]])).toBe(true)
  })
})

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

const requestWithEntryPoint = (pageKey, entryPoint) => {
  const request = createMockRequest()

  request.yar.get.mockImplementation((key) =>
    key === INVOICING_ENTRY_POINTS_KEY ? { [pageKey]: entryPoint } : undefined
  )

  return request
}

describe('getUkInvoiceAddressBackLink', () => {
  const getBackLink = getUkInvoiceAddressBackLink
  const pageKey = INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS

  test('returns the page the user came from', () => {
    const request = requestWithEntryPoint(
      pageKey,
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
    )

    expect(getBackLink(request)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
    )
  })

  test('keeps the change flow when going back to a page mid-journey', () => {
    const request = requestWithEntryPoint(
      pageKey,
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
    )

    expect(getBackLink(request, 'change')).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS}?action=change`
    )
  })

  test('links to check answers bare, as going back there ends the change flow', () => {
    const request = requestWithEntryPoint(
      pageKey,
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )

    expect(getBackLink(request, 'change')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('falls back to review in the change flow when no entry point was recorded', () => {
    expect(getBackLink(createMockRequest(), 'change')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })

  test('falls back to the postcode search when no entry point was recorded', () => {
    expect(getBackLink(createMockRequest())).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
    )
  })
})

describe('getConfirmAddressBackLink', () => {
  test('always goes back to the postcode search', () => {
    expect(getConfirmAddressBackLink()).toBe(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
    )
  })

  test('keeps the change flow when going back to the postcode search', () => {
    expect(getConfirmAddressBackLink('change')).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
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

describe('withAction', () => {
  const route = marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS

  test('carries the action through so the change flow survives the hop', () => {
    expect(withAction(route, 'change')).toBe(`${route}?action=change`)
  })

  test('escapes the action rather than injecting it into the query string', () => {
    expect(withAction(route, 'change&foo=bar')).toBe(
      `${route}?action=change%26foo%3Dbar`
    )
  })

  test.each([
    ['there is no action', undefined],
    ['the action is empty', '']
  ])('leaves the route alone when %s', (_name, action) => {
    expect(withAction(route, action)).toBe(route)
  })
})

describe('getMissingPrerequisiteRedirect', () => {
  test.each([
    ['the address type is international', INVOICE_TYPE_OPTIONS.INTERNATIONAL],
    ['the address type has not been answered', undefined]
  ])('sends the user back to the UK question when %s', (_name, type) => {
    expect(
      getMissingPrerequisiteRedirect(
        { invoiceAddressType: type },
        undefined,
        true
      )
    ).toBe(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
    )
  })

  test('sends the user back to the postcode search when the page has nothing to show', () => {
    expect(
      getMissingPrerequisiteRedirect(
        { invoiceAddressType: INVOICE_TYPE_OPTIONS.UK },
        undefined,
        false
      )
    ).toBe(marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH)
  })

  test('keeps the user in the change flow when redirecting', () => {
    expect(
      getMissingPrerequisiteRedirect(
        { invoiceAddressType: INVOICE_TYPE_OPTIONS.UK },
        'change',
        false
      )
    ).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}?action=change`
    )
  })

  test('allows the page to render when the journey is complete', () => {
    expect(
      getMissingPrerequisiteRedirect(
        { invoiceAddressType: INVOICE_TYPE_OPTIONS.UK },
        undefined,
        true
      )
    ).toBeNull()
  })
})
