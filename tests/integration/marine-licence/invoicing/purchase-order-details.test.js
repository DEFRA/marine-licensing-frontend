import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import {
  expectFieldsetError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { purchaseOrderDetailsSettings } from '~/src/server/common/validation/invoicing/constants.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  citizenUserSession,
  agentSession
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

const mockMarineLicenceWithInvoicing = {
  ...mockMarineLicenceApplication,
  invoicing: {
    invoiceAddressType: 'uk'
  }
}

describe('Purchase order details', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
  })

  test('page elements', async () => {
    mockMarineLicence(mockMarineLicenceWithInvoicing)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      purchaseOrderDetailsSettings.heading
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    getByRole(document, 'button', { name: 'Save and continue' })
  })

  test('redirects citizens to the task list without showing the page', async () => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)
    mockMarineLicence(mockMarineLicenceWithInvoicing)

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('form state when no decision set', async () => {
    mockMarineLicence(mockMarineLicenceWithInvoicing)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: purchaseOrderDetailsSettings.heading,
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: purchaseOrderDetailsSettings.heading,
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when a purchase order number is set', async () => {
    mockMarineLicence({
      ...mockMarineLicenceWithInvoicing,
      invoicing: {
        ...mockMarineLicenceWithInvoicing.invoicing,
        purchaseOrderDetails: {
          requiresPurchaseOrder: 'yes',
          purchaseOrderNumber: 'PO-12345'
        }
      }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: purchaseOrderDetailsSettings.heading,
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel: 'Enter the purchase order number',
      value: 'PO-12345'
    })
  })

  test('should show a validation error when submitted empty', async () => {
    mockMarineLicence(mockMarineLicenceWithInvoicing)

    const { document } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
      server: getServer(),
      formData: {}
    })

    expectFieldsetError({
      document,
      fieldsetLabel: purchaseOrderDetailsSettings.heading,
      errorMessage:
        'Select whether you require a purchase order number on the invoice',
      findByHeading: true
    })
  })

  test('should show a validation error when "yes" is selected but the purchase order number is missing', async () => {
    mockMarineLicence(mockMarineLicenceWithInvoicing)

    const { document } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
      server: getServer(),
      formData: { requiresPurchaseOrder: 'yes', purchaseOrderNumber: '' }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: purchaseOrderDetailsSettings.heading,
      errorMessage: 'Enter the purchase order number',
      findByHeading: true,
      useErrorClass: true
    })
  })

  test('should redirect to check invoicing details on valid submission', async () => {
    mockMarineLicence(mockMarineLicenceWithInvoicing)

    const { response } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
      server: getServer(),
      formData: { requiresPurchaseOrder: 'no' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })
})
