import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { clearMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
import {
  apiRoutes,
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import {
  PAYMENT_PROBLEM_VIEW_ROUTE,
  paymentRetryController,
  paymentReturnController
} from '#src/server/marine-licence/payment/controller.js'
import { PAYMENT_PROBLEM_CONTENT } from '#src/server/marine-licence/payment/content.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

const returnId = '7d6b8f8e-1c7a-4f3e-9b2a-0c1d2e3f4a5b'
const applicationId = '507f1f77bcf86cd799439011'

const mockOutcome = (value) =>
  vi.mocked(authRequests.authenticatedGetRequest).mockResolvedValue({
    payload: { message: 'success', value: { applicationId, ...value } }
  })

describe('payment controllers', () => {
  const getServer = setupTestServer()
  let mockRequest
  let mockH

  beforeEach(() => {
    mockH = { view: vi.fn(), redirect: vi.fn() }
    mockRequest = {
      params: { returnId },
      state: { userSession: {} },
      logger: { warn: vi.fn() }
    }
  })

  describe('paymentReturnController', () => {
    test('clears the cache and redirects to confirmation once submitted', async () => {
      mockOutcome({
        status: 'success',
        finished: true,
        code: null,
        applicationReference: 'MLA/2026/10001'
      })

      await paymentReturnController.handler(mockRequest, mockH)

      expect(authRequests.authenticatedGetRequest).toHaveBeenCalledWith(
        mockRequest,
        `${apiRoutes.MARINE_LICENCE_PAYMENT}/${returnId}`
      )
      expect(clearMarineLicenceCache).toHaveBeenCalledWith(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=MLA%2F2026%2F10001`
      )
    })

    test.each([
      ['P0010', 'failed', PAYMENT_PROBLEM_CONTENT.P0010],
      ['P0020', 'failed', PAYMENT_PROBLEM_CONTENT.P0020],
      ['P0030', 'failed', PAYMENT_PROBLEM_CONTENT.P0030],
      ['P0050', 'error', PAYMENT_PROBLEM_CONTENT.default]
    ])('renders the problem page for %s', async (code, status, content) => {
      mockOutcome({ status, finished: true, code, applicationReference: null })

      await paymentReturnController.handler(mockRequest, mockH)

      expect(clearMarineLicenceCache).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(PAYMENT_PROBLEM_VIEW_ROUTE, {
        pageTitle: content.heading,
        ...content,
        retryUrl: `${marineLicenceRoutes.MARINE_LICENCE_PAYMENT_RETRY}/${returnId}`,
        dashboardUrl: routes.DASHBOARD
      })
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(code)
      )
    })

    test('renders the not complete page for an unfinished payment', async () => {
      mockOutcome({
        status: 'started',
        finished: false,
        code: null,
        applicationReference: null
      })

      await paymentReturnController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PAYMENT_PROBLEM_VIEW_ROUTE,
        expect.objectContaining({
          heading: PAYMENT_PROBLEM_CONTENT.unfinished.heading,
          buttonText: 'Continue to payment'
        })
      )
    })

    test('renders the problem page with a retry form', async () => {
      mockOutcome({
        status: 'failed',
        finished: true,
        code: 'P0010',
        applicationReference: null
      })

      const { statusCode, result } = await makeGetRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_PAYMENT_RETURN}/${returnId}`,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window
      expect(document.querySelector('h1').textContent).toBe(
        'Your payment was declined'
      )
      expect(
        document
          .querySelector('#retry-payment')
          .closest('form')
          .getAttribute('action')
      ).toBe(`${marineLicenceRoutes.MARINE_LICENCE_PAYMENT_RETRY}/${returnId}`)
      expect(document.querySelector('#retry-payment').textContent.trim()).toBe(
        'Try again'
      )
    })

    test('rejects a return id that is not a UUID', async () => {
      const { statusCode } = await makeGetRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_PAYMENT_RETURN}/not-a-uuid`,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.badRequest)
    })

    test('throws on an unexpected backend response', async () => {
      vi.mocked(authRequests.authenticatedGetRequest).mockResolvedValue({
        payload: { message: 'error' }
      })

      await expect(
        paymentReturnController.handler(mockRequest, mockH)
      ).rejects.toThrow(errorMessages.UNEXPECTED_API_RESPONSE)
    })
  })

  describe('paymentRetryController', () => {
    beforeEach(() => {
      vi.mocked(authUtils.getUserSession).mockResolvedValue({
        displayName: 'Test User',
        email: 'test@example.com'
      })
    })

    test('starts a new payment for the application and redirects to Pay', async () => {
      mockOutcome({ status: 'failed', finished: true, code: 'P0030' })
      vi.mocked(authRequests.authenticatedPostRequest).mockResolvedValue({
        payload: {
          message: 'success',
          value: { nextUrl: 'https://pay.example/next' }
        }
      })

      await paymentRetryController.handler(mockRequest, mockH)

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        mockRequest,
        apiRoutes.MARINE_LICENCE_PAYMENT,
        {
          id: applicationId,
          userName: 'Test User',
          userEmail: 'test@example.com'
        }
      )
      expect(mockH.redirect).toHaveBeenCalledWith('https://pay.example/next')
    })

    test('redirects to confirmation if the application was submitted meanwhile', async () => {
      mockOutcome({
        status: 'success',
        finished: true,
        applicationReference: 'MLA/2026/10001'
      })

      await paymentRetryController.handler(mockRequest, mockH)

      expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=MLA%2F2026%2F10001`
      )
    })

    test('throws when the user session is missing', async () => {
      vi.mocked(authUtils.getUserSession).mockResolvedValue({})

      await expect(
        paymentRetryController.handler(mockRequest, mockH)
      ).rejects.toThrow(errorMessages.USER_SESSION_NOT_FOUND)
      expect(authRequests.authenticatedGetRequest).not.toHaveBeenCalled()
    })
  })
})
