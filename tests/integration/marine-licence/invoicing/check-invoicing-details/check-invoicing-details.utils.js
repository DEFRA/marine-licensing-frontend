import {
  ADDRESS_HEADING,
  ADDRESS_TYPE_HEADING,
  CONTACT_EMAIL,
  CONTACT_FULL_NAME,
  CONTACT_ORG_NAME,
  CONTACT_PHONE_NUMBER,
  PO_HEADING
} from '#src/server/common/helpers/marine-licence/invoicing/invoicing-review-data.js'

export const getRowByKey = (summary, keyText) => {
  const rows = summary.querySelectorAll('.govuk-summary-list__row')

  return Array.from(rows).find((row) => {
    const keyElement = row.querySelector('.govuk-summary-list__key')
    return keyElement && keyElement.textContent.trim() === keyText
  })
}

const validateContactDetails = (invoicingSummary, expectedPageContent) => {
  const fullNameRow = getRowByKey(invoicingSummary, CONTACT_FULL_NAME)
  expect(fullNameRow.textContent).toContain(expectedPageContent.fullName)

  if (expectedPageContent.organisationName) {
    const organisationNameRow = getRowByKey(invoicingSummary, CONTACT_ORG_NAME)
    expect(organisationNameRow.textContent).toContain(
      expectedPageContent.organisationName
    )
  }

  const phoneNumberRow = getRowByKey(invoicingSummary, CONTACT_PHONE_NUMBER)
  expect(phoneNumberRow.textContent).toContain(expectedPageContent.phoneNumber)

  const emailAddressRow = getRowByKey(invoicingSummary, CONTACT_EMAIL)
  expect(emailAddressRow.textContent).toContain(
    expectedPageContent.emailAddress
  )
}

export const validateInvoicingSummaryForOrganisation = (
  document,
  expectedPageContent
) => {
  const invoicingSummary = document.querySelector('#invoicing-review')
  expect(invoicingSummary).toBeTruthy()

  const addressTypeRow = getRowByKey(invoicingSummary, ADDRESS_TYPE_HEADING)
  expect(addressTypeRow.textContent).toContain(
    expectedPageContent.invoiceAddressType
  )

  const addressRow = getRowByKey(invoicingSummary, ADDRESS_HEADING)
  expect(addressRow.textContent).toContain(expectedPageContent.invoiceAddress)

  validateContactDetails(invoicingSummary, expectedPageContent)

  const purchaseOrderRow = getRowByKey(invoicingSummary, PO_HEADING)
  expect(purchaseOrderRow.textContent).toContain(
    expectedPageContent.purchaseOrderDetails
  )

  const rows = invoicingSummary.querySelectorAll('.govuk-summary-list__row')
  expect(rows.length).toBe(7)
}

export const validateInvoicingSummaryForIndividual = (
  document,
  expectedPageContent
) => {
  const invoicingSummary = document.querySelector('#invoicing-review')
  expect(invoicingSummary).toBeTruthy()

  const addressTypeRow = getRowByKey(invoicingSummary, ADDRESS_TYPE_HEADING)
  expect(addressTypeRow.textContent).toContain(
    expectedPageContent.invoiceAddressType
  )

  const addressRow = getRowByKey(invoicingSummary, ADDRESS_HEADING)
  expect(addressRow.textContent).toContain(expectedPageContent.invoiceAddress)

  validateContactDetails(invoicingSummary, expectedPageContent)

  expect(getRowByKey(invoicingSummary, CONTACT_ORG_NAME)).toBeUndefined()

  const rows = invoicingSummary.querySelectorAll('.govuk-summary-list__row')
  expect(rows.length).toBe(5)
}
