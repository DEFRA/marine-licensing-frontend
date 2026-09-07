import { vi } from 'vitest'
import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getRowByKey } from '~/tests/integration/marine-licence/invoicing/check-invoicing-details/check-invoicing-details.utils.js'
import { ADDRESS_HEADING } from '~/src/server/common/helpers/marine-licence/invoicing/invoicing-review-data.js'
import { agentSession } from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { ADDRESS_SOURCE } from '~/src/server/common/validation/invoicing/constants.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

const CHANGE = '?action=change'

const anAddress = {
  addressLine: 'TYNESIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  buildingName: 'TYNESIDE HOUSE',
  street: 'SKINNERBURN ROAD',
  town: 'NEWCASTLE UPON TYNE',
  postcode: 'NE4 7AR'
}

const anotherAddress = {
  ...anAddress,
  addressLine: 'QUAYSIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE, NE4 7AR',
  buildingName: 'QUAYSIDE HOUSE'
}

const mockInvoicing = (invoicing) =>
  mockMarineLicence({
    ...mockMarineLicenceApplication,
    invoicing: {
      ...mockMarineLicenceApplication.invoicing,
      invoiceAddressType: 'uk',
      ...invoicing
    }
  })

describe('Changing an invoice address provided by postcode lookup', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('the Change link on check invoicing details goes to the postcode search', async () => {
    mockInvoicing({ invoiceAddressSource: ADDRESS_SOURCE.LOOKUP })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
      server: getServer()
    })

    const addressRow = getRowByKey(
      document.querySelector('#invoicing-review'),
      ADDRESS_HEADING
    )

    expect(getByRole(addressRow, 'link')).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH}${CHANGE}`
    )
  })

  test('the Change link is unchanged for a manually entered address', async () => {
    mockInvoicing({ invoiceAddressSource: ADDRESS_SOURCE.MANUAL })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
      server: getServer()
    })

    const addressRow = getRowByKey(
      document.querySelector('#invoicing-review'),
      ADDRESS_HEADING
    )

    expect(getByRole(addressRow, 'link')).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS}${CHANGE}`
    )
  })

  test('confirming the address saves it and returns to check invoicing details', async () => {
    const { setMarineLicenceCache } = mockInvoicing({
      invoiceAddressSource: ADDRESS_SOURCE.LOOKUP,
      invoiceAddressSearch: { postcode: 'NE4 7AR' },
      selectedInvoiceAddress: anotherAddress
    })

    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS}${CHANGE}`,
      server: getServer(),
      formData: {}
    })

    expect(setMarineLicenceCache).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        invoicing: expect.objectContaining({
          invoiceAddress: expect.objectContaining({
            addressLine1: 'QUAYSIDE HOUSE SKINNERBURN ROAD',
            addressTown: 'NEWCASTLE UPON TYNE',
            addressPostcode: 'NE4 7AR'
          }),
          invoiceAddressSource: ADDRESS_SOURCE.LOOKUP
        })
      })
    )
    expect(authenticatedPatchRequest).toHaveBeenCalled()
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  })
})
