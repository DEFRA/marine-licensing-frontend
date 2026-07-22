import {
  formatInvoiceAddress,
  invoicingReviewData
} from '#src/server/common/helpers/marine-licence/invoicing/invoicing-review-data.js'
import { INVOICE_TYPE_OPTIONS } from '#src/server/common/validation/invoicing/constants.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('formatInvoiceAddress', () => {
  test('formats a UK address with all fields', () => {
    expect(
      formatInvoiceAddress(
        {
          addressLine1: '123 Example Street',
          addressLine2: 'Flat 2',
          addressTown: 'Example town',
          addressCounty: 'Example county',
          addressPostcode: 'AA1 1AA'
        },
        INVOICE_TYPE_OPTIONS.UK
      )
    ).toBe(
      '123 Example Street<br>Flat 2<br>Example town<br>Example county<br>AA1 1AA'
    )
  })

  test('formats a UK address without optional fields', () => {
    expect(
      formatInvoiceAddress(
        {
          addressLine1: '123 Example Street',
          addressLine2: '',
          addressTown: 'Example town',
          addressCounty: '',
          addressPostcode: 'AA1 1AA'
        },
        INVOICE_TYPE_OPTIONS.UK
      )
    ).toBe('123 Example Street<br>Example town<br>AA1 1AA')
  })

  test('formats an international address', () => {
    expect(
      formatInvoiceAddress(
        {
          address: '123 International Street',
          country: 'France'
        },
        INVOICE_TYPE_OPTIONS.INTERNATIONAL
      )
    ).toBe('123 International Street<br>France')
  })

  test('returns undefined when address is missing', () => {
    expect(
      formatInvoiceAddress(undefined, INVOICE_TYPE_OPTIONS.UK)
    ).toBeUndefined()
  })
})

describe('invoicingReviewData', () => {
  test('returns html or text value for fields', () => {
    const { invoicing } = mockMarineLicenceApplication

    const result = invoicingReviewData(invoicing)

    expect(result.invoiceAddressType.value).toEqual({
      text: 'UK'
    })

    expect(result.invoiceAddress.value).toEqual({
      html: '123 Example Street<br>Flat 2<br>Example town<br>Example country<br>AA1 1AA'
    })

    expect(result.fullName.value).toEqual({
      text: invoicing.invoiceContactDetails.fullName
    })

    expect(result.emailAddress.value).toEqual({
      text: invoicing.invoiceContactDetails.emailAddress
    })

    expect(result.organisationName.value).toEqual({
      text: invoicing.invoiceContactDetails.organisationName
    })

    expect(result.phoneNumber.value).toEqual({
      text: invoicing.invoiceContactDetails.phoneNumber
    })
  })
})
