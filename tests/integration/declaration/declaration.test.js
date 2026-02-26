import { vi } from 'vitest'
import { within } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  mockExemption,
  setupTestServer,
  mockExemptionMcmsContext
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockExemption as mockExemptionData } from '~/src/server/test-helpers/mocks/exemption.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import * as authUtils from '~/src/server/common/plugins/auth/utils.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const mockUserSession = {
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  sessionId: 'test-session-123'
}

describe('Declaration page', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue(mockUserSession)
    mockExemption(mockExemptionData)
    mockExemptionMcmsContext()
  })

  describe('GET /exemption/declaration', () => {
    it('should display the declaration page with all required elements', async () => {
      const document = await loadPage({
        requestUrl: routes.DECLARATION,
        server: getServer()
      })

      const heading = document.querySelector('h1')
      expect(heading.textContent.trim()).toBe('Declaration')

      const caption = document.querySelector('.govuk-caption-l')
      expect(caption).toHaveTextContent(mockExemptionData.projectName)

      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', routes.CHECK_YOUR_ANSWERS)
      expect(backLink.textContent.trim()).toBe('Back')

      const confirmText = within(document).getByText('I confirm that I:')
      expect(confirmText).toBeInTheDocument()
    })

    it('should display all four declaration bullet points', async () => {
      const document = await loadPage({
        requestUrl: routes.DECLARATION,
        server: getServer()
      })

      const bulletList = document.querySelector('.govuk-list--bullet')
      expect(bulletList).toBeInTheDocument()

      const items = bulletList.querySelectorAll('li')
      expect(items).toHaveLength(4)
      expect(items[0].textContent).toBe('am authorised to make this agreement')
      expect(items[1].textContent).toBe(
        'to the best of my knowledge, the information provided is correct'
      )
      expect(items[2].textContent).toBe(
        'could be prosecuted if I give information I know, or suspect is false'
      )
      expect(items[3].textContent).toBe(
        'understand I may be sued if I give incorrect information, knowingly or recklessly'
      )
    })

    it('should display the submit button with correct text', async () => {
      const document = await loadPage({
        requestUrl: routes.DECLARATION,
        server: getServer()
      })

      const button = document.querySelector('#confirm-and-send-information')
      expect(button).toBeInTheDocument()
      expect(button.textContent.trim()).toBe('Confirm and send information')
    })

    it('should include a CSRF token in the form', async () => {
      const document = await loadPage({
        requestUrl: routes.DECLARATION,
        server: getServer()
      })

      const csrfInput = document.querySelector('input[name="csrfToken"]')
      expect(csrfInput).toBeInTheDocument()
      expect(csrfInput).toHaveAttribute('type', 'hidden')
    })
  })

  describe('POST /exemption/declaration', () => {
    it('should redirect to confirmation page on successful submission', async () => {
      vi.mocked(authRequests.authenticatedPostRequest).mockResolvedValue({
        payload: {
          message: 'success',
          value: {
            applicationReference: 'EXE/2025/10001',
            submittedAt: '2025-01-01T10:00:00.000Z'
          }
        }
      })

      const response = await makePostRequest({
        url: routes.DECLARATION,
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        '/exemption/confirmation?applicationReference=EXE/2025/10001'
      )
    })

    it('should call the backend submit API with correct payload', async () => {
      vi.mocked(authRequests.authenticatedPostRequest).mockResolvedValue({
        payload: {
          message: 'success',
          value: {
            applicationReference: 'EXE/2025/10001',
            submittedAt: '2025-01-01T10:00:00.000Z'
          }
        }
      })

      await makePostRequest({
        url: routes.DECLARATION,
        server: getServer()
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/submit',
        {
          id: mockExemptionData.id,
          userName: mockUserSession.displayName,
          userEmail: mockUserSession.email
        }
      )
    })

    it('should return 400 when backend API returns an error', async () => {
      vi.mocked(authRequests.authenticatedPostRequest).mockRejectedValue(
        new Error('API Error')
      )

      const response = await makePostRequest({
        url: routes.DECLARATION,
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.badRequest)
    })

    it('should return 400 when backend API returns unexpected response', async () => {
      vi.mocked(authRequests.authenticatedPostRequest).mockResolvedValue({
        payload: { message: 'error', error: 'Something went wrong' }
      })

      const response = await makePostRequest({
        url: routes.DECLARATION,
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.badRequest)
    })
  })
})
