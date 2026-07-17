export const INVOICE_TYPE_OPTIONS = {
  UK: 'uk',
  INTERNATIONAL: 'international'
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
