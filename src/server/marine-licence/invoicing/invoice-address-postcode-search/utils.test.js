import {
  buildNoAddressesFoundError,
  buildLookupUnavailableError,
  buildTooManyAddressesError,
  getInitialSearchPayload
} from '#src/server/marine-licence/invoicing/invoice-address-postcode-search/utils.js'
import {
  ADDRESS_SOURCE,
  INVOICE_TYPE_OPTIONS,
  invoiceAddressPostcodeSearchErrorMessages
} from '#src/server/common/validation/invoicing/constants.js'

describe('#invoiceAddressPostcodeSearchUtils', () => {
  test.each([
    [
      'buildNoAddressesFoundError',
      buildNoAddressesFoundError,
      invoiceAddressPostcodeSearchErrorMessages.NO_ADDRESSES_FOUND
    ],
    [
      'buildLookupUnavailableError',
      buildLookupUnavailableError,
      invoiceAddressPostcodeSearchErrorMessages.SERVICE_UNAVAILABLE
    ],
    [
      'buildTooManyAddressesError',
      buildTooManyAddressesError,
      invoiceAddressPostcodeSearchErrorMessages.TOO_MANY_ADDRESSES
    ]
  ])(
    '%s builds a summary and error anchored to the postcode field',
    (_name, build, expectedText) => {
      const expectedError = {
        href: '#postcode',
        text: expectedText,
        field: 'postcode'
      }

      expect(build()).toEqual({
        errorSummary: [expectedError],
        errors: { postcode: expectedError }
      })
    }
  )

  test('the two messages are distinct so an outage is not reported as no results', () => {
    expect(buildLookupUnavailableError().errorSummary[0].text).not.toBe(
      buildNoAddressesFoundError().errorSummary[0].text
    )
  })
})

describe('#getInitialSearchPayload', () => {
  const savedLookup = {
    invoiceAddressType: INVOICE_TYPE_OPTIONS.UK,
    invoiceAddressSource: ADDRESS_SOURCE.LOOKUP,
    invoiceAddress: {
      addressLine1: 'THE QUAY',
      addressPostcode: 'BH15 1HP'
    }
  }

  test('returns the previous search when there is one', () => {
    const invoiceAddressSearch = {
      postcode: 'NE4 7AR',
      propertyNameOrNumber: 'Tyneside House'
    }

    expect(
      getInitialSearchPayload({ ...savedLookup, invoiceAddressSearch })
    ).toEqual(invoiceAddressSearch)
  })

  test('returns the postcode of a saved looked-up address', () => {
    expect(getInitialSearchPayload(savedLookup)).toEqual({
      postcode: 'BH15 1HP'
    })
  })

  test.each([
    [
      'a manually entered address',
      { ...savedLookup, invoiceAddressSource: ADDRESS_SOURCE.MANUAL }
    ],
    [
      'an address with no recorded source',
      { ...savedLookup, invoiceAddressSource: undefined }
    ],
    [
      'an international address',
      {
        ...savedLookup,
        invoiceAddressType: INVOICE_TYPE_OPTIONS.INTERNATIONAL
      }
    ],
    ['no saved address', { ...savedLookup, invoiceAddress: undefined }],
    ['no invoicing details', undefined]
  ])('returns an empty payload for %s', (_description, invoicing) => {
    expect(getInitialSearchPayload(invoicing)).toEqual({})
  })
})
