export const INVOICE_TYPE_OPTIONS = {
  UK: 'uk',
  INTERNATIONAL: 'international'
}

// How the stored invoice address was provided, which decides where the "Change" link
// on the check-invoicing-details page goes: back to the postcode search, or to manual entry.
export const ADDRESS_SOURCE = {
  LOOKUP: 'lookup',
  MANUAL: 'manual'
}

export const INVOICE_TYPE_LABELS = {
  UK: 'UK',
  INTERNATIONAL: 'International'
}

const IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_TITLE =
  "Is the invoice contact's address in the UK or international?"

export const isInvoiceAddressUkOrInternationalSettings = {
  pageTitle: IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_TITLE,
  heading: IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_TITLE
}

export const isInvoiceAddressUkOrInternationalErrorMessages = {
  INVOICE_ADDRESS_TYPE_REQUIRED:
    "Select whether the invoice contact's address is UK or international"
}

const INVOICE_ADDRESS_POSTCODE_SEARCH_TITLE =
  "What is the invoice contact's UK address?"

export const invoiceAddressPostcodeSearchSettings = {
  pageTitle: INVOICE_ADDRESS_POSTCODE_SEARCH_TITLE,
  heading: INVOICE_ADDRESS_POSTCODE_SEARCH_TITLE
}

export const invoiceAddressPostcodeSearchErrorMessages = {
  POSTCODE_REQUIRED: 'Enter the postcode',
  POSTCODE_INVALID: 'Enter a valid postcode',
  PROPERTY_NAME_OR_NUMBER_MAX_LENGTH:
    'The property name or number must be 50 characters or fewer',
  NO_ADDRESSES_FOUND:
    'We could not find any addresses for that postcode. Enter a known postcode, or enter the address manually.',
  SERVICE_UNAVAILABLE:
    'There is a problem with the address lookup service. Try again later, or enter the address manually.',
  TOO_MANY_ADDRESSES:
    'There are too many addresses for that postcode to search by property name or number. Enter the address manually.'
}

const CHOOSE_YOUR_ADDRESS_TITLE = 'Choose your address'

export const chooseYourAddressSettings = {
  pageTitle: CHOOSE_YOUR_ADDRESS_TITLE,
  heading: CHOOSE_YOUR_ADDRESS_TITLE
}

export const chooseYourAddressErrorMessages = {
  SELECTED_ADDRESS_REQUIRED: 'Select an address, or select "None of these"'
}

const CONFIRM_ADDRESS_TITLE = 'Review and confirm'

export const confirmAddressSettings = {
  pageTitle: CONFIRM_ADDRESS_TITLE,
  heading: CONFIRM_ADDRESS_TITLE
}

const UK_INVOICE_ADDRESS_TITLE = 'UK invoice address'

export const ukInvoiceAddressSettings = {
  pageTitle: UK_INVOICE_ADDRESS_TITLE,
  heading: UK_INVOICE_ADDRESS_TITLE
}

export const ukInvoiceAddressErrorMessages = {
  ADDRESS_LINE_1_REQUIRED: 'Enter the first line of the address',
  ADDRESS_LINE_1_MAX_LENGTH:
    'The first line of the address must be 100 characters or fewer',
  ADDRESS_LINE_2_MAX_LENGTH:
    'The second line of the address must be 100 characters or fewer',
  ADDRESS_TOWN_REQUIRED: 'Enter the town or city',
  ADDRESS_TOWN_MAX_LENGTH: 'The town or city must be 30 characters or fewer',
  ADDRESS_COUNTY_MAX_LENGTH: 'The county must be 50 characters or fewer',
  ADDRESS_POSTCODE_REQUIRED: 'Enter the postcode',
  ADDRESS_POSTCODE_INVALID: 'Enter a valid postcode'
}

const INTERNATIONAL_INVOICE_ADDRESS_TITLE = 'International invoice address'

export const internationalInvoiceAddressSettings = {
  pageTitle: INTERNATIONAL_INVOICE_ADDRESS_TITLE,
  heading: INTERNATIONAL_INVOICE_ADDRESS_TITLE
}

export const internationalInvoiceAddressErrorMessages = {
  INVOICING_COUNTRY_REQUIRED: 'Select the country',
  INVOICING_ADDRESS_REQUIRED: 'Enter the address',
  INVOICING_ADDRESS_MAX_LENGTH: 'Address must be 300 characters or fewer'
}

const INVOICE_CONTACT_DETAILS_TITLE = 'Invoice contact details'

export const invoiceContactDetailsSettings = {
  pageTitle: INVOICE_CONTACT_DETAILS_TITLE,
  heading: INVOICE_CONTACT_DETAILS_TITLE
}

export const invoiceContactDetailsErrorMessages = {
  INVOICING_CONTACT_FULL_NAME_REQUIRED: 'Enter the full name',
  INVOICING_CONTACT_FULL_NAME_MAX_LENGTH:
    'Full name must be 100 characters or fewer',
  INVOICING_CONTACT_ORGANISATION_NAME_REQUIRED: 'Enter the organisation name',
  INVOICING_CONTACT_ORGANISATION_NAME_MAX_LENGTH:
    'Organisation name must be 100 characters or fewer',
  INVOICING_CONTACT_PHONE_NUMBER_REQUIRED: 'Enter the phone number',
  INVOICING_CONTACT_PHONE_NUMBER_INVALID: 'Enter a valid phone number',
  INVOICING_CONTACT_EMAIL_ADDRESS_REQUIRED: 'Enter the email address',
  INVOICING_CONTACT_EMAIL_ADDRESS_MAX_LENGTH:
    'Email address must be 254 characters or fewer',
  INVOICING_CONTACT_EMAIL_ADDRESS_INVALID:
    'Enter an email address in the correct format, like name@example.com'
}

const PURCHASE_ORDER_DETAILS_TITLE =
  'Do you require a purchase order number on the invoice?'

export const purchaseOrderDetailsSettings = {
  pageTitle: PURCHASE_ORDER_DETAILS_TITLE,
  heading: PURCHASE_ORDER_DETAILS_TITLE
}

export const purchaseOrderDetailsErrorMessages = {
  INVOICING_PURCHASE_ORDER_REQUIRED:
    'Select whether you require a purchase order number on the invoice',
  INVOICING_PURCHASE_ORDER_NUMBER_REQUIRED: 'Enter the purchase order number',
  INVOICING_PURCHASE_ORDER_NUMBER_MAX_LENGTH:
    'Purchase order number must be 30 characters or fewer'
}
