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
