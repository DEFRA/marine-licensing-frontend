import { vi } from 'vitest'
import {
  buildContentSecurityPolicy,
  contentSecurityPolicy
} from './content-security-policy.js'

const configValues = vi.hoisted(() => ({
  'cdpUploader.cdpUploadServiceBaseUrl': 'http://uploader',
  'defraId.cspRedirectHosts': [
    'https://dcidmtest.b2clogin.com',
    'https://your-account.cpdev.cui.defra.gov.uk'
  ],
  clarityProjectId: '123',
  googleTagManagerKey: '',
  cdpEnvironment: 'local'
}))

vi.mock('~/src/config/config.js', () => ({
  config: {
    get: vi.fn((key) => configValues[key])
  }
}))

const baseOptions = {
  nonce: 'abc123',
  uploaderServiceHost: 'http://uploader',
  cspRedirectHosts: ['https://dcidmtest.b2clogin.com'],
  clarityProjectId: '',
  googleTagManagerKey: '',
  includePreviewHosts: false
}

const directive = (header, name) =>
  header.split('; ').find((part) => part.startsWith(`${name} `))

describe('buildContentSecurityPolicy', () => {
  test('sets the static directives', () => {
    const header = buildContentSecurityPolicy(baseOptions)

    expect(directive(header, 'base-uri')).toBe("base-uri 'self'")
    expect(directive(header, 'default-src')).toBe("default-src 'self'")
    expect(directive(header, 'font-src')).toBe("font-src 'self'")
    expect(directive(header, 'form-action')).toBe(
      "form-action 'self' http://uploader https://dcidmtest.b2clogin.com"
    )
    expect(directive(header, 'frame-ancestors')).toBe("frame-ancestors 'none'")
    expect(directive(header, 'manifest-src')).toBe("manifest-src 'self'")
    expect(directive(header, 'media-src')).toBe("media-src 'self'")
    expect(directive(header, 'object-src')).toBe("object-src 'none'")
    expect(directive(header, 'style-src')).toBe("style-src 'self'")
  })

  test('ends script-src with the nonce and includes the govuk-frontend hash', () => {
    const header = buildContentSecurityPolicy(baseOptions)

    expect(directive(header, 'script-src')).toBe(
      "script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' 'nonce-abc123'"
    )
  })

  test('never allows unsafe-inline or unsafe-eval', () => {
    const header = buildContentSecurityPolicy({
      ...baseOptions,
      clarityProjectId: '123',
      googleTagManagerKey: 'GTM-TEST123',
      includePreviewHosts: true
    })

    expect(header).not.toContain('unsafe-inline')
    expect(header).not.toContain('unsafe-eval')
  })

  describe('Clarity hosts', () => {
    test('are omitted when no project ID is configured', () => {
      const header = buildContentSecurityPolicy(baseOptions)

      expect(header).not.toContain('clarity.ms')
    })

    test('are added to script-src and connect-src when a project ID is configured', () => {
      const header = buildContentSecurityPolicy({
        ...baseOptions,
        clarityProjectId: '123'
      })

      expect(directive(header, 'script-src')).toBe(
        "script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' https://www.clarity.ms/tag/123 https://scripts.clarity.ms 'nonce-abc123'"
      )
      expect(directive(header, 'connect-src')).toBe(
        "connect-src 'self' https://*.clarity.ms/collect"
      )
    })
  })

  describe('Google Tag Manager hosts', () => {
    test('are omitted when no container key is configured', () => {
      const header = buildContentSecurityPolicy(baseOptions)

      expect(header).not.toContain('googletagmanager.com')
      expect(header).not.toContain('google-analytics.com')
      expect(directive(header, 'frame-src')).toBe("frame-src 'self'")
      expect(directive(header, 'img-src')).toBe(
        "img-src 'self' https://tile.openstreetmap.org"
      )
    })

    test('are added to script-src, connect-src, img-src and frame-src when a key is configured', () => {
      const header = buildContentSecurityPolicy({
        ...baseOptions,
        googleTagManagerKey: 'GTM-TEST123'
      })

      expect(directive(header, 'script-src')).toBe(
        "script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' https://www.googletagmanager.com 'nonce-abc123'"
      )
      expect(directive(header, 'connect-src')).toBe(
        "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com"
      )
      expect(directive(header, 'img-src')).toBe(
        "img-src 'self' https://tile.openstreetmap.org https://www.googletagmanager.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com"
      )
      expect(directive(header, 'frame-src')).toBe(
        "frame-src 'self' https://www.googletagmanager.com"
      )
    })

    test('include the apex analytics.google.com host because the wildcard does not match it', () => {
      const header = buildContentSecurityPolicy({
        ...baseOptions,
        googleTagManagerKey: 'GTM-TEST123'
      })

      expect(directive(header, 'connect-src')).toContain(
        ' https://analytics.google.com '
      )
    })
  })

  describe('Tag Assistant preview hosts', () => {
    test('are omitted in production even with a key', () => {
      const header = buildContentSecurityPolicy({
        ...baseOptions,
        googleTagManagerKey: 'GTM-TEST123',
        includePreviewHosts: false
      })

      expect(header).not.toContain('tagmanager.google.com')
      expect(header).not.toContain('fonts.googleapis.com')
      expect(header).not.toContain('gstatic.com')
    })

    test('are omitted outside production when there is no key', () => {
      const header = buildContentSecurityPolicy({
        ...baseOptions,
        includePreviewHosts: true
      })

      expect(header).not.toContain('tagmanager.google.com')
    })

    test('are added outside production when a key is configured', () => {
      const header = buildContentSecurityPolicy({
        ...baseOptions,
        googleTagManagerKey: 'GTM-TEST123',
        includePreviewHosts: true
      })

      expect(directive(header, 'script-src')).toBe(
        "script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' https://www.googletagmanager.com https://tagmanager.google.com 'nonce-abc123'"
      )
      expect(directive(header, 'style-src')).toBe(
        "style-src 'self' https://www.googletagmanager.com https://tagmanager.google.com https://fonts.googleapis.com"
      )
      expect(directive(header, 'img-src')).toContain(
        'https://ssl.gstatic.com https://www.gstatic.com'
      )
      expect(directive(header, 'font-src')).toBe(
        "font-src 'self' https://fonts.gstatic.com data:"
      )
    })
  })
})

describe('contentSecurityPolicy plugin', () => {
  let server
  let mockResponse
  let mockRequest
  let mockH
  let onPreResponseHandler

  beforeEach(async () => {
    configValues.googleTagManagerKey = ''
    configValues.clarityProjectId = '123'
    configValues.cdpEnvironment = 'local'
    mockResponse = {
      header: vi.fn().mockReturnThis(),
      isBoom: false,
      variety: 'view',
      source: { context: { existing: true } }
    }
    mockRequest = { response: mockResponse }
    mockH = { continue: Symbol('continue') }
    server = { ext: vi.fn() }
    await contentSecurityPolicy.register(server)
    onPreResponseHandler = server.ext.mock.calls[0][1]
  })

  test('registers as a Hapi plugin with an onPreResponse hook', () => {
    expect(contentSecurityPolicy.name).toBe('content-security-policy')
    expect(server.ext).toHaveBeenCalledWith(
      'onPreResponse',
      expect.any(Function)
    )
  })

  test('returns h.continue', () => {
    expect(onPreResponseHandler(mockRequest, mockH)).toBe(mockH.continue)
  })

  test('sets the header with a fresh 32-character hex nonce and exposes it to the view', () => {
    onPreResponseHandler(mockRequest, mockH)

    const [, header] = mockResponse.header.mock.calls[0]
    const [, nonce] = header.match(/'nonce-([a-f0-9]{32})'/)
    expect(header).toContain(
      "script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' https://www.clarity.ms/tag/123 https://scripts.clarity.ms 'nonce-"
    )
    expect(mockResponse.source.context).toEqual({
      existing: true,
      cspNonce: nonce
    })
  })

  test('uses a different nonce per response', () => {
    onPreResponseHandler(mockRequest, mockH)
    onPreResponseHandler(mockRequest, mockH)

    const nonces = mockResponse.header.mock.calls.map(
      ([, header]) => header.match(/'nonce-([a-f0-9]{32})'/)[1]
    )
    expect(nonces[0]).not.toBe(nonces[1])
  })

  test('does not touch a non-view response context but still sets the header', () => {
    mockResponse.variety = 'plain'
    delete mockResponse.source

    onPreResponseHandler(mockRequest, mockH)

    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'self'")
    )
  })

  test('adds Google hosts when the key is configured at registration', async () => {
    configValues.googleTagManagerKey = 'GTM-TEST123'
    server = { ext: vi.fn() }
    await contentSecurityPolicy.register(server)
    const handler = server.ext.mock.calls[0][1]

    handler(mockRequest, mockH)

    const [, header] = mockResponse.header.mock.calls[0]
    expect(header).toContain(
      "frame-src 'self' https://www.googletagmanager.com"
    )
    expect(header).toContain('https://tagmanager.google.com')
  })

  test('omits preview hosts in prod', async () => {
    configValues.googleTagManagerKey = 'GTM-TEST123'
    configValues.cdpEnvironment = 'prod'
    server = { ext: vi.fn() }
    await contentSecurityPolicy.register(server)
    const handler = server.ext.mock.calls[0][1]

    handler(mockRequest, mockH)

    const [, header] = mockResponse.header.mock.calls[0]
    expect(header).toContain('https://www.googletagmanager.com')
    expect(header).not.toContain('https://tagmanager.google.com')
  })
})
