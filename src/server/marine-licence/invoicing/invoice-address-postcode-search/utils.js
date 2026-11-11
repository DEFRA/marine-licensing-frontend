import { errorDescriptionByFieldName } from '#src/server/common/helpers/errors.js'
import {
  ADDRESS_SOURCE,
  INVOICE_TYPE_OPTIONS,
  invoiceAddressPostcodeSearchErrorMessages
} from '#src/server/common/validation/invoicing/constants.js'

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

const isSavedLookupAddress = (invoicing) =>
  invoicing?.invoiceAddressType === INVOICE_TYPE_OPTIONS.UK &&
  invoicing.invoiceAddressSource === ADDRESS_SOURCE.LOOKUP &&
  Boolean(invoicing.invoiceAddress?.addressPostcode)

export const getInitialSearchPayload = (invoicing) => {
  if (invoicing?.invoiceAddressSearch) {
    return invoicing.invoiceAddressSearch
  }

  if (isSavedLookupAddress(invoicing)) {
    return { postcode: invoicing.invoiceAddress.addressPostcode }
  }

  return {}
}
