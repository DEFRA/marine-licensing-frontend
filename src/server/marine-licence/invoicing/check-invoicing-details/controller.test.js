import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  CHECK_INVOICING_DETAILS_VIEW_ROUTE,
  checkInvoicingDetailsController,
  checkInvoicingDetailsSubmitController
} from '#src/server/marine-licence/invoicing/check-invoicing-details/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import * as userSessionUtils from '#src/server/common/helpers/user-session-utils.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/helpers/user-session-utils.js')

function createMockHandler(type = 'view') {
  if (type === 'redirect') {
    return { redirect: vi.fn() }
  }
  return { view: vi.fn() }
}

describe('#checkInvoicingDetails', () => {
  const mockRequest = createMockRequest()
  let mockGetMarineLicenceById

  beforeEach(() => {
    mockGetMarineLicenceById = vi.fn()
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: mockGetMarineLicenceById
    })

    mockGetMarineLicenceById.mockResolvedValue(mockMarineLicenceApplication)
    vi.mocked(userSessionUtils.isIndividualUser).mockResolvedValue(false)
  })

  describe('checkInvoicingDetailsController', () => {
    test('renders view with purchase order back link for organisation users', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        id: 'test-id',
        projectName: 'Test Project'
      })

      const h = createMockHandler()

      await checkInvoicingDetailsController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        CHECK_INVOICING_DETAILS_VIEW_ROUTE,
        expect.objectContaining({
          pageTitle: 'Check your invoicing details',
          heading: 'Check your invoicing details',
          projectName: 'Test Project',
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
          isIndividual: false
        })
      )
    })

    test('renders view with contact details back link for individual users', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        id: 'test-id',
        projectName: 'Test Project'
      })
      vi.mocked(userSessionUtils.isIndividualUser).mockResolvedValue(true)

      const h = createMockHandler()

      await checkInvoicingDetailsController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        CHECK_INVOICING_DETAILS_VIEW_ROUTE,
        expect.objectContaining({
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
          isIndividual: true
        })
      )
    })
  })

  describe('checkInvoicingDetailsSubmitController', () => {
    test('redirects to check-your-answers with anchor on submit when returnTo session value is set', async () => {
      const h = createMockHandler('redirect')
      const request = createMockRequest({ payload: {} })
      request.yar.get.mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )

      await checkInvoicingDetailsSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS +
        '#invoicing-card'
      )
    })
  })
})
