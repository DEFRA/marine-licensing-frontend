import { vi } from 'vitest'
import { loginEntraController } from '~/src/server/auth/sign-in-entra.js'

describe('#login with Entra ID', () => {
  test('should redirect to the stored URL', async () => {
    const redirectUrl = '/view-details/abc'
    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue(redirectUrl) }
    }
    const mockH = { redirect: vi.fn() }
    await loginEntraController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(redirectUrl)
  })

  test('should redirect to a fallback path if no stored URL', async () => {
    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue(null) }
    }
    const mockH = { redirect: vi.fn() }
    await loginEntraController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith('/')
  })
})
