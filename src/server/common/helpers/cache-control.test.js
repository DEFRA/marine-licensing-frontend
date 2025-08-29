import { setPageCacheControlHeaders } from './cache-control.js'

describe('setPageCacheControlHeaders', () => {
  let mockRequest
  let mockResponse
  let mockH

  beforeEach(() => {
    mockResponse = {
      header: jest.fn().mockReturnThis()
    }
    mockRequest = {
      path: '/test',
      response: mockResponse
    }
    mockH = {
      continue: Symbol('continue')
    }
  })

  describe('when response is a Boom error', () => {
    beforeEach(() => {
      mockRequest.response = {
        isBoom: true
      }
    })

    it('should return h.continue without setting headers', () => {
      const result = setPageCacheControlHeaders(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockResponse.header).not.toHaveBeenCalled()
    })
  })

  describe('when request path is a static asset', () => {
    const staticAssetPaths = [
      '/assets/app.js',
      '/static/styles.css',
      '/images/logo.png',
      '/assets/icon.svg',
      '/fonts/roboto.woff2',
      '/build/app.bundle.js',
      '/dist/main.css.map'
    ]

    staticAssetPaths.forEach((path) => {
      it(`should return h.continue without setting headers for ${path}`, () => {
        mockRequest.path = path

        const result = setPageCacheControlHeaders(mockRequest, mockH)

        expect(result).toBe(mockH.continue)
        expect(mockResponse.header).not.toHaveBeenCalled()
      })
    })
  })

  describe('when request path is a page route', () => {
    const pageRoutePaths = [
      '/',
      '/about',
      '/exemption/dashboard',
      '/health',
      '/exemption/project-name',
      '/auth/login'
    ]

    pageRoutePaths.forEach((path) => {
      it(`should set cache control headers for ${path}`, () => {
        mockRequest.path = path

        const result = setPageCacheControlHeaders(mockRequest, mockH)

        expect(result).toBe(mockH.continue)
        expect(mockResponse.header).toHaveBeenCalledWith(
          'Cache-Control',
          'no-cache, no-store, must-revalidate'
        )
        expect(mockResponse.header).toHaveBeenCalledWith('Pragma', 'no-cache')
        expect(mockResponse.header).toHaveBeenCalledWith('Expires', '0')
        expect(mockResponse.header).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('case sensitivity', () => {
    const mixedCaseAssetPaths = [
      '/assets/App.JS',
      '/static/Styles.CSS',
      '/images/Logo.PNG',
      '/assets/Icon.SVG'
    ]

    mixedCaseAssetPaths.forEach((path) => {
      it(`should handle case insensitive static asset detection for ${path}`, () => {
        mockRequest.path = path

        const result = setPageCacheControlHeaders(mockRequest, mockH)

        expect(result).toBe(mockH.continue)
        expect(mockResponse.header).not.toHaveBeenCalled()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle paths with query parameters', () => {
      mockRequest.path = '/page?param=value'

      const result = setPageCacheControlHeaders(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockResponse.header).toHaveBeenCalledTimes(3)
    })

    it('should handle root path', () => {
      mockRequest.path = '/'

      const result = setPageCacheControlHeaders(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockResponse.header).toHaveBeenCalledTimes(3)
    })

    it('should handle paths with file extensions that are not static assets', () => {
      mockRequest.path = '/download/file.pdf'

      const result = setPageCacheControlHeaders(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockResponse.header).toHaveBeenCalledTimes(3)
    })
  })
})
