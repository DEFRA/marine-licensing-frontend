import { renderComponent } from '#src/server/test-helpers/component-helpers.js'
import {
  ADDRESS_HEADING,
  ADDRESS_TYPE_HEADING,
  CONTACT_EMAIL,
  CONTACT_FULL_NAME,
  CONTACT_ORG_NAME,
  CONTACT_PHONE_NUMBER,
  PO_HEADING
} from '#src/server/common/helpers/marine-licence/invoicing/invoicing-review-data.js'

const invoicingData = {
  invoiceAddressType: {
    key: { text: ADDRESS_TYPE_HEADING },
    value: { text: 'UK' }
  },
  invoiceAddress: {
    key: { text: ADDRESS_HEADING },
    value: { text: 'Test address' }
  },
  fullName: {
    key: { text: CONTACT_FULL_NAME },
    value: { text: 'Jon Doe' }
  },
  organisationName: {
    key: { text: CONTACT_ORG_NAME },
    value: { text: 'Example Organisation' }
  },
  phoneNumber: {
    key: { text: CONTACT_PHONE_NUMBER },
    value: { text: '0191 111 1111' }
  },
  emailAddress: {
    key: { text: CONTACT_EMAIL },
    value: { text: 'john.doe@example.com' }
  },
  purchaseOrderDetails: {
    key: { text: PO_HEADING },
    value: { text: 'PO-12345' }
  }
}

describe('Marine Licence Invoicing Card Component', () => {
  let $component

  beforeEach(() => {
    $component = renderComponent('marine-licence/invoicing-card', {
      invoicingData
    })
  })

  test('Should render card component', () => {
    expect($component('#invoicing-card')).toHaveLength(1)

    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Invoicing details'
    )
  })

  test('Should display all details', () => {
    expect($component.html()).toContain(ADDRESS_TYPE_HEADING)
    expect($component.html()).toContain(ADDRESS_HEADING)
    expect($component.html()).toContain(CONTACT_FULL_NAME)
    expect($component.html()).toContain(CONTACT_ORG_NAME)
    expect($component.html()).toContain(CONTACT_PHONE_NUMBER)
    expect($component.html()).toContain(CONTACT_EMAIL)
  })

  test('Should not render when nautical mile data is absent', () => {
    const $comp = renderComponent('marine-licence/invoicing-card', {
      invoicingData: {}
    })

    expect($comp('#invoicing-card')).toHaveLength(0)
  })

  test('Should show change link when not read only', () => {
    const $comp = renderComponent('marine-licence/invoicing-card', {
      invoicingData: {
        invoiceAddressType: {
          key: { text: ADDRESS_TYPE_HEADING },
          value: { text: 'UK' }
        }
      },
      changeLink: '/marine-licence/check-invoicing-details',
      isReadOnly: false
    })
    expect($comp.html()).toContain(
      '/marine-licence/check-invoicing-details?from=check-your-answers'
    )
  })

  test('Should not show organisation name and PO number when individual user data set', () => {
    const individualInvoicingData = { ...invoicingData }
    delete individualInvoicingData.purchaseOrderDetails
    delete individualInvoicingData.organisationName

    const $comp = renderComponent('marine-licence/invoicing-card', {
      invoicingData: individualInvoicingData
    })

    expect($comp.html()).not.toContain(CONTACT_ORG_NAME)
    expect($comp.html()).not.toContain(PO_HEADING)
  })

  test('Should not show change link when read only', () => {
    const $comp = renderComponent('marine-licence/invoicing-card', {
      invoicingData: {
        invoiceAddressType: {
          key: { text: ADDRESS_TYPE_HEADING },
          value: { text: 'UK' }
        }
      },
      changeLink: '/marine-licence/check-invoicing-details',
      isReadOnly: true
    })

    expect($comp.html()).not.toContain(
      'marine-licence/check-invoicing-details?from=check-your-answers'
    )
  })
})
