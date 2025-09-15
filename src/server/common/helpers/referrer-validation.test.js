import {
  isValidReferrerPath,
  extractReferrerPath,
  storeReferrer,
  getStoredReferrer,
  clearStoredReferrer,
  getBackUrl
} from './referrer-validation.js'

const createMockRequest = () => ({
  yar: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  }
})

describe('referrer-validation', () => {
  describe('isValidReferrerPath', () => {
    const validPaths = [
      '/',
      '/exemption/task-list',
      '/exemption/site-details/coordinates',
      '/auth/login',
      '/about',
      '/help/accessibility',
      '/path/with/many/segments',
      '/path-with-hyphens',
      '/path_with_underscores',
      '/path123with456numbers',
      '/path?query=value',
      '/path?query=value&another=param',
      '/path#fragment',
      '/path?query=value#fragment'
    ]

    validPaths.forEach((path) => {
      it(`should return true for valid path: ${path}`, () => {
        expect(isValidReferrerPath(path)).toBe(true)
      })
    })

    const invalidInputTestCases = [
      {
        category: 'null and undefined values',
        inputs: [null, undefined, '', 0, false, NaN, {}]
      },
      { category: 'non-string types', inputs: [123, [], {}, true] },
      {
        category: 'paths not starting with /',
        inputs: [
          'exemption/task-list',
          'relative/path',
          'http://example.com',
          'https://example.com/path',
          'ftp://example.com',
          'mailto:test@example.com'
        ]
      },
      {
        category: 'path traversal attacks',
        inputs: [
          '/path/../../../etc/passwd',
          '/exemption/../../../sensitive',
          '/path/..%2F..%2F..%2Fetc%2Fpasswd',
          '/../root',
          '/./../../etc/passwd',
          '/path/to/../../../system'
        ]
      },
      {
        category: 'double slashes',
        inputs: [
          '/path//to/resource',
          '//example.com/path',
          '/path//double//slashes',
          '/start//middle//end',
          '///triple/slash'
        ]
      },
      {
        category: 'javascript injection',
        inputs: [
          '/javascript:alert(1)',
          '/path/javascript:malicious',
          '/JAVASCRIPT:ALERT(1)',
          '/Javascript:Alert(1)',
          '/jAvAsCrIpT:alert()',
          'javascript:void(0)'
        ]
      },
      {
        category: 'data URI injection',
        inputs: [
          '/data:text/html,<script>alert(1)</script>',
          '/path/data:image/svg+xml,malicious',
          '/DATA:TEXT/PLAIN,test',
          '/Data:Text/Html,content',
          'data:text/plain,hello'
        ]
      },
      {
        category: 'vbscript injection',
        inputs: [
          '/vbscript:msgbox("xss")',
          '/path/vbscript:malicious',
          '/VBSCRIPT:MSGBOX(1)',
          '/VbScript:Alert()',
          'vbscript:test'
        ]
      }
    ]

    invalidInputTestCases.forEach(({ category, inputs }) => {
      describe(`invalid paths - ${category}`, () => {
        inputs.forEach((input) => {
          it(`should return false for ${category}: ${String(input)}`, () => {
            expect(isValidReferrerPath(input)).toBe(false)
          })
        })
      })
    })

    it('should accept excluded paths parameter', () => {
      expect(isValidReferrerPath('/help/cookies', ['/help/cookies'])).toBe(
        false
      )
      expect(isValidReferrerPath('/help/cookies', [])).toBe(true)
      expect(isValidReferrerPath('/other/path', ['/other/path'])).toBe(false)
    })

    it('should use empty array as default for excludedPaths', () => {
      expect(isValidReferrerPath('/help/cookies')).toBe(true)
    })

    const edgeCaseTests = [
      {
        name: 'very long paths',
        input: '/' + 'a'.repeat(1000),
        expected: true
      },
      {
        name: 'paths with special characters',
        input: '/path-with_special.chars123',
        expected: true
      },
      {
        name: 'encoded characters in safe paths',
        input: '/path%20with%20spaces',
        expected: true
      }
    ]

    edgeCaseTests.forEach(({ name, input, expected }) => {
      it(`should handle ${name}`, () => {
        expect(isValidReferrerPath(input)).toBe(expected)
      })
    })
  })

  describe('extractReferrerPath', () => {
    const urlExtractionTests = [
      { url: 'http://localhost/path', expected: '/path' },
      {
        url: 'https://example.com/exemption/task-list',
        expected: '/exemption/task-list'
      },
      { url: 'http://localhost:3000/about', expected: '/about' },
      {
        url: 'https://marine-licensing.service.gov.uk/help',
        expected: '/help'
      },
      { url: 'http://example.com/', expected: '/' },
      {
        url: 'https://test.com/path/to/resource?query=value',
        expected: '/path/to/resource'
      },
      { url: 'http://localhost/path#fragment', expected: '/path' },
      {
        url: 'https://example.com/path?query=value#fragment',
        expected: '/path'
      }
    ]

    urlExtractionTests.forEach(({ url, expected }) => {
      it(`should extract pathname ${expected} from ${url}`, () => {
        expect(extractReferrerPath(url)).toBe(expected)
      })
    })

    const invalidInputs = [null, undefined, '', 123, {}, [], false, true]
    invalidInputs.forEach((input) => {
      it(`should return null for invalid input: ${String(input)}`, () => {
        expect(extractReferrerPath(input)).toBeNull()
      })
    })

    const invalidUrls = [
      'not-a-url',
      '://missing-protocol',
      'http://',
      'https://'
    ]
    invalidUrls.forEach((url) => {
      it(`should return null for invalid URL: ${url}`, () => {
        expect(extractReferrerPath(url)).toBeNull()
      })
    })

    const specialUrlTests = [
      {
        name: 'ftp URL (valid URL structure)',
        url: 'ftp://example.com',
        expected: '/'
      },
      {
        name: 'javascript URL (valid URL structure)',
        url: 'javascript:alert(1)',
        expected: 'alert(1)'
      },
      {
        name: 'data URL (valid URL structure)',
        url: 'data:text/html,content',
        expected: 'text/html,content'
      },
      {
        name: 'URLs with ports',
        url: 'http://localhost:8080/test',
        expected: '/test'
      },
      {
        name: 'URLs with authentication',
        url: 'https://user:pass@example.com/path',
        expected: '/path'
      },
      { name: 'IPv6 URLs', url: 'http://[::1]:3000/path', expected: '/path' }
    ]

    specialUrlTests.forEach(({ name, url, expected }) => {
      it(`should handle ${name}`, () => {
        expect(extractReferrerPath(url)).toBe(expected)
      })
    })
  })

  describe('storeReferrer', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest()
      jest.clearAllMocks()
    })

    const validReferrerTests = [
      {
        url: 'http://localhost/exemption/task-list',
        expectedPath: '/exemption/task-list'
      },
      { url: 'https://example.com/valid/path', expectedPath: '/valid/path' },
      {
        url: 'https://example.com:8080/path/to/resource?query=value#fragment',
        expectedPath: '/path/to/resource'
      }
    ]

    validReferrerTests.forEach(({ url, expectedPath }) => {
      it(`should store valid referrer: ${url}`, () => {
        storeReferrer(mockRequest, url)
        expect(mockRequest.yar.set).toHaveBeenCalledWith(
          'pageReferrer',
          expectedPath
        )
      })
    })

    const invalidReferrers = [
      'javascript:alert(1)', // JS injection
      'not-a-url', // Invalid URL
      'http://localhost/javascript:alert(1)', // URL with invalid path
      null,
      undefined,
      ''
    ]

    invalidReferrers.forEach((referrer) => {
      it(`should not store invalid referrer: ${referrer}`, () => {
        storeReferrer(mockRequest, referrer)
        expect(mockRequest.yar.set).not.toHaveBeenCalled()
      })
    })

    it('should store cookies page by default when no excluded paths provided', () => {
      storeReferrer(mockRequest, 'http://localhost/help/cookies')
      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'pageReferrer',
        '/help/cookies'
      )
    })

    it('should not store cookies page when in excluded paths', () => {
      storeReferrer(mockRequest, 'http://localhost/help/cookies', [
        '/help/cookies'
      ])
      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })

    it('should store path traversal URL after normalization', () => {
      storeReferrer(mockRequest, 'http://example.com/../../../etc/passwd')
      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'pageReferrer',
        '/etc/passwd'
      )
    })
  })

  describe('getStoredReferrer', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest()
      jest.clearAllMocks()
    })

    const validStoredReferrers = [
      '/exemption/task-list',
      '/exemption/site-details/coordinates?step=2'
    ]

    validStoredReferrers.forEach((storedPath) => {
      it(`should return valid stored referrer: ${storedPath}`, () => {
        mockRequest.yar.get.mockReturnValue(storedPath)
        const result = getStoredReferrer(mockRequest)

        expect(mockRequest.yar.get).toHaveBeenCalledWith('pageReferrer')
        expect(result).toBe(storedPath)
      })
    })

    const invalidStoredPaths = [
      '/../../../etc/passwd', // Path traversal
      '/javascript:alert(1)', // JS injection
      'not-starting-with-slash', // Invalid format
      null,
      undefined,
      ''
    ]

    invalidStoredPaths.forEach((path) => {
      it(`should return null for invalid stored path: ${String(path)}`, () => {
        mockRequest.yar.get.mockReturnValue(path)
        expect(getStoredReferrer(mockRequest)).toBeNull()
      })
    })

    it('should return cookies page by default when no excluded paths provided', () => {
      mockRequest.yar.get.mockReturnValue('/help/cookies')
      expect(getStoredReferrer(mockRequest)).toBe('/help/cookies')
    })

    it('should return null for cookies page when in excluded paths', () => {
      mockRequest.yar.get.mockReturnValue('/help/cookies')
      expect(getStoredReferrer(mockRequest, ['/help/cookies'])).toBeNull()
    })
  })

  describe('clearStoredReferrer', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest()
      jest.clearAllMocks()
    })

    it('should clear the stored referrer', () => {
      clearStoredReferrer(mockRequest)
      expect(mockRequest.yar.clear).toHaveBeenCalledWith('pageReferrer')
    })

    it('should be callable multiple times', () => {
      clearStoredReferrer(mockRequest)
      clearStoredReferrer(mockRequest)
      expect(mockRequest.yar.clear).toHaveBeenCalledTimes(2)
    })
  })

  describe('getBackUrl', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest()
      jest.clearAllMocks()
    })

    it('should return stored referrer when valid', () => {
      const storedPath = '/exemption/task-list'
      mockRequest.yar.get.mockReturnValue(storedPath)
      expect(getBackUrl(mockRequest)).toBe(storedPath)
    })

    it('should return stored referrer over custom fallback', () => {
      const storedPath = '/exemption/site-details'
      mockRequest.yar.get.mockReturnValue(storedPath)
      expect(getBackUrl(mockRequest, '/custom/fallback')).toBe(storedPath)
    })

    const fallbackTests = [
      { name: 'default fallback', fallback: undefined, expected: '/' },
      {
        name: 'custom fallback',
        fallback: '/custom/fallback',
        expected: '/custom/fallback'
      },
      { name: 'empty string fallback', fallback: '', expected: '' },
      { name: 'null fallback', fallback: null, expected: null }
    ]

    fallbackTests.forEach(({ name, fallback, expected }) => {
      it(`should return ${name} when no referrer stored`, () => {
        mockRequest.yar.get.mockReturnValue(null)
        expect(getBackUrl(mockRequest, fallback)).toBe(expected)
      })
    })

    const invalidPaths = [
      '/../../../etc/passwd',
      '/javascript:alert(1)',
      'invalid-path'
    ]
    invalidPaths.forEach((invalidPath) => {
      it(`should return fallback for invalid stored path: ${invalidPath}`, () => {
        mockRequest.yar.get.mockReturnValue(invalidPath)
        expect(getBackUrl(mockRequest, '/fallback')).toBe('/fallback')
      })
    })

    it('should return cookies page by default when no excluded paths provided', () => {
      mockRequest.yar.get.mockReturnValue('/help/cookies')
      expect(getBackUrl(mockRequest, '/fallback')).toBe('/help/cookies')
    })

    it('should return fallback for cookies page when in excluded paths', () => {
      mockRequest.yar.get.mockReturnValue('/help/cookies')
      expect(getBackUrl(mockRequest, '/fallback', ['/help/cookies'])).toBe(
        '/fallback'
      )
    })
  })

  describe('integration scenarios', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest()
      jest.clearAllMocks()
    })

    it('should handle complete workflow: store -> get -> clear', () => {
      const referrerUrl = 'https://example.com/exemption/task-list'

      storeReferrer(mockRequest, referrerUrl)
      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'pageReferrer',
        '/exemption/task-list'
      )

      mockRequest.yar.get.mockReturnValue('/exemption/task-list')
      expect(getStoredReferrer(mockRequest)).toBe('/exemption/task-list')
      expect(getBackUrl(mockRequest, '/')).toBe('/exemption/task-list')

      clearStoredReferrer(mockRequest)
      expect(mockRequest.yar.clear).toHaveBeenCalledWith('pageReferrer')
    })

    it('should handle malicious input throughout workflow', () => {
      const maliciousUrl = 'javascript:alert("xss")'

      storeReferrer(mockRequest, maliciousUrl)
      expect(mockRequest.yar.set).not.toHaveBeenCalled()

      mockRequest.yar.get.mockReturnValue(null)
      expect(getBackUrl(mockRequest, '/safe-fallback')).toBe('/safe-fallback')
    })

    it('should handle invalid data in session', () => {
      mockRequest.yar.get.mockReturnValue('/javascript:alert(1)')

      expect(getStoredReferrer(mockRequest)).toBeNull()
      expect(getBackUrl(mockRequest, '/home')).toBe('/home')
    })
  })
})
