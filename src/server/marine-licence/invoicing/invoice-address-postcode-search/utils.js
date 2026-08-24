import { errorDescriptionByFieldName } from '#src/server/common/helpers/errors.js'
import { invoiceAddressPostcodeSearchErrorMessages } from '#src/server/common/validation/invoicing/constants.js'

const buildPostcodeError = (text) => {
  const errorSummary = [
    {
      href: '#postcode',
      text,
      field: 'postcode'
    }
  ]

  return {
    errorSummary,
    errors: errorDescriptionByFieldName(errorSummary)
  }
}

export const buildNoAddressesFoundError = () =>
  buildPostcodeError(
    invoiceAddressPostcodeSearchErrorMessages.NO_ADDRESSES_FOUND
  )

export const buildLookupUnavailableError = () =>
  buildPostcodeError(
    invoiceAddressPostcodeSearchErrorMessages.SERVICE_UNAVAILABLE
  )

export const buildTooManyAddressesError = () =>
  buildPostcodeError(
    invoiceAddressPostcodeSearchErrorMessages.TOO_MANY_ADDRESSES
  )
