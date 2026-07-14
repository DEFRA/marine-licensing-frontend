import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { isInvoiceAddressUkOrInternationalSettings } from '~/src/server/common/validation/invoicing/constants.js'

describe('Is invoice address UK or international', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project'
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      isInvoiceAddressUkOrInternationalSettings.heading
    )
    getByRole(document, 'button', { name: 'Continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(
      getByText(
        document,
        'We will send an invoice to the contact you provide here once we have assessed your application. This usually takes around 13 weeks.'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'You will have 28 days to pay from the date of the invoice. No payment is taken during this application.'
      )
    ).toBeInTheDocument()
  })

  test('form state when no decision set', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: isInvoiceAddressUkOrInternationalSettings.heading,
        inputLabel: 'UK',
        findByHeading: true
      })
    ).not.toBeChecked()

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: isInvoiceAddressUkOrInternationalSettings.heading,
        inputLabel: 'International',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when decision is set', async () => {
    mockMarineLicence({
      ...marineLicence,
      invoicing: {
        invoiceAddressType: 'international'
      }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: isInvoiceAddressUkOrInternationalSettings.heading,
        inputLabel: 'International',
        findByHeading: true
      })
    ).toBeChecked()
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicence)

    const { document } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
      server: getServer(),
      formData: {
        invoiceAddressType: ''
      }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: isInvoiceAddressUkOrInternationalSettings.heading,
      errorMessage:
        "Select whether the invoice contact's address is UK or international",
      findByHeading: true
    })
  })

  test('should stay on the same page on valid submission', async () => {
    mockMarineLicence(marineLicence)

    const { response } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
      server: getServer(),
      formData: {
        invoiceAddressType: 'uk'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
    )
  })
})
