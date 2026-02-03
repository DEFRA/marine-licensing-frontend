import { vi } from 'vitest'
import { contentSecurityPolicy } from './content-security-policy.js'

vi.mock('~/src/config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'cdpUploader.cdpUploadServiceBaseUrl') {
        return 'http://uploader'
      }
      if (key === 'defraId.cspRedirectHosts') {
        return [
          'https://dcidmtest.b2clogin.com',
          'https://your-account.cpdev.cui.defra.gov.uk'
        ]
      }
      return '123' // clarityProjectId
    })
  }
}))

describe('contentSecurityPolicy', () => {
  let server
  let mockResponse
  let mockRequest
  let mockH

  beforeEach(() => {
    mockResponse = {
      header: vi.fn().mockReturnThis(),
      isBoom: false
    }
    mockRequest = {
      response: mockResponse
    }
    mockH = {
      continue: Symbol('continue')
    }
    server = {
      ext: vi.fn()
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

    it('should register onPreResponse hook', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(server.ext).toHaveBeenCalledWith(
        'onPreResponse',
        expect.any(Function)
      )
    })

    it('should return h.continue', () => {
      const result = onPreResponseHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    it('should set base-uri directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("base-uri 'self'")
      )
    })

    it('should set default-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      )
    })

    it('should set connect-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining(
          "connect-src 'self' https://*.clarity.ms/collect"
        )
      )
    })

    it('should set font-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("font-src 'self'")
      )
    })

    it('should set form-action directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining(
          "form-action 'self' http://uploader https://dcidmtest.b2clogin.com https://your-account.cpdev.cui.defra.gov.uk"
        )
      )
    })

    it('should set frame-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("frame-src 'self'")
      )
    })

    it('should set frame-ancestors directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("frame-ancestors 'none'")
      )
    })

    it('should set img-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("img-src 'self' https://tile.openstreetmap.org")
      )
    })

    it('should set manifest-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("manifest-src 'self'")
      )
    })

    it('should set media-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("media-src 'self'")
      )
    })

    it('should set object-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("object-src 'none'")
      )
    })

    it('should set script-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining(
          "script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' https://www.clarity.ms/tag/123 https://scripts.clarity.ms 'nonce-"
        )
      )
    })

    it('should set style-src directive', () => {
      onPreResponseHandler(mockRequest, mockH)

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("style-src 'self'")
      )
    })
  })
})
