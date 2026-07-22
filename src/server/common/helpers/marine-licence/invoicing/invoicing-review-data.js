import {
  INVOICE_TYPE_LABELS,
  INVOICE_TYPE_OPTIONS
} from '#src/server/common/validation/invoicing/constants.js'

export const ADDRESS_TYPE_HEADING = 'Address type'
export const ADDRESS_HEADING = 'Address'
export const CONTACT_FULL_NAME = 'Full name'
export const CONTACT_ORG_NAME = 'Organisation name'
export const CONTACT_PHONE_NUMBER = 'Phone number'
export const CONTACT_EMAIL = 'Email address'
export const PO_HEADING = 'Purchase order number'

const formatAddressLines = (lines) =>
  lines.filter((line) => line?.trim()).join('<br>')

export const formatInvoiceAddress = (invoiceAddress, invoiceAddressType) => {
  if (!invoiceAddress) {
    return undefined
  }

  if (invoiceAddressType === INVOICE_TYPE_OPTIONS.UK) {
    return formatAddressLines([
      invoiceAddress.addressLine1,
      invoiceAddress.addressLine2,
      invoiceAddress.addressTown,
      invoiceAddress.addressCounty,
      invoiceAddress.addressPostcode
    ])
  }

  if (invoiceAddressType === INVOICE_TYPE_OPTIONS.INTERNATIONAL) {
    return formatAddressLines([invoiceAddress.address, invoiceAddress.country])
  }

  return undefined
}

const getHeading = (property) => {
  switch (property) {
    case 'invoiceAddressType':
      return ADDRESS_TYPE_HEADING
    case 'invoiceAddress':
      return ADDRESS_HEADING
    case 'fullName':
      return CONTACT_FULL_NAME
    case 'organisationName':
      return CONTACT_ORG_NAME
    case 'phoneNumber':
      return CONTACT_PHONE_NUMBER
    case 'emailAddress':
      return CONTACT_EMAIL
    case 'purchaseOrderDetails':
      return PO_HEADING
    default:
      return undefined
  }
}

const getDisplayValue = (key, value, invoicing) => {
  switch (key) {
    case 'invoiceAddressType':
      return value === INVOICE_TYPE_OPTIONS.UK
        ? INVOICE_TYPE_LABELS.UK
        : INVOICE_TYPE_LABELS.INTERNATIONAL
    case 'invoiceAddress':
      return formatInvoiceAddress(value, invoicing.invoiceAddressType)
    case 'fullName':
      return value
    case 'organisationName':
      return value
    case 'phoneNumber':
      return value
    case 'emailAddress':
      return value
    case 'purchaseOrderDetails':
      return value.requiresPurchaseOrder === 'no'
        ? 'Not required'
        : value.purchaseOrderNumber
    default:
      return undefined
  }
}

const HTML_OUTPUT_FIELDS = new Set(['invoiceAddress'])

const getValueObject = (key, value, invoicing) => {
  const displayValue = getDisplayValue(key, value, invoicing)

  if (HTML_OUTPUT_FIELDS.has(key)) {
    return { html: displayValue }
  }

  return { text: displayValue }
}

export const invoicingReviewData = (invoicing) => {
  if (!invoicing) {
    return {}
  }

  const invoicingInput = Object.entries(invoicing).flatMap((entry) => {
    const [key, value] = entry

    if (key === 'invoiceContactDetails') {
      return Object.entries(value)
    }

    return [entry]
  })

  return invoicingInput.reduce((acc, [key, value]) => {
    acc[key] = {
      key: { text: getHeading(key) },
      value: getValueObject(key, value, invoicing)
    }
    return acc
  }, {})
}
