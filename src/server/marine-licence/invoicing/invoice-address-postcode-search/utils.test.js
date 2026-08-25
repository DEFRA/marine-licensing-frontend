import {
  buildNoAddressesFoundError,
  buildLookupUnavailableError,
  buildTooManyAddressesError
} from '#src/server/marine-licence/invoicing/invoice-address-postcode-search/utils.js'
import { invoiceAddressPostcodeSearchErrorMessages } from '#src/server/common/validation/invoicing/constants.js'

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
