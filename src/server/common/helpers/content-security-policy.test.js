import { contentSecurityPolicy } from './content-security-policy.js'

describe('contentSecurityPolicy', () => {
  let server
  let mockResponse
  let mockRequest
  let mockH

  beforeEach(() => {
    mockResponse = {
      header: jest.fn().mockReturnThis(),
      isBoom: false
    }
    mockRequest = {
      response: mockResponse
    }
    mockH = {
      continue: Symbol('continue')
    }
    server = {
      ext: jest.fn()
    }
  })

  it('should register as a Hapi plugin', () => {
    expect(contentSecurityPolicy.name).toBe('content-security-policy')
    expect(contentSecurityPolicy.register).toBeInstanceOf(Function)
  })

  describe('when registered', () => {
    let onPreResponseHandler

    beforeEach(async () => {
      await contentSecurityPolicy.register(server)
      onPreResponseHandler = server.ext.mock.calls[0][1]
    })

    it('should set CSP header with correct directives', () => {
      const result = onPreResponseHandler(mockRequest, mockH)

      expect(server.ext).toHaveBeenCalledWith(
        'onPreResponse',
        expect.any(Function)
      )
      expect(result).toBe(mockH.continue)
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        "default-src 'self'; font-src 'self' data:; connect-src 'self' data:; media-src 'self'; style-src 'self'; script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='; img-src 'self' data: https://tile.openstreetmap.org; frame-src 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' http://localhost:7337; manifest-src 'self'"
      )
    })

    it('should not set CSP header for Boom errors', () => {
      mockRequest.response.isBoom = true

      const result = onPreResponseHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockResponse.header).not.toHaveBeenCalled()
    })
  })
})
