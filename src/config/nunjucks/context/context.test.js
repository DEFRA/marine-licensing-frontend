import { beforeEach, describe, expect, test, vi, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { getExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'

vi.mock(
  '~/src/server/common/helpers/authenticated-requests.js',
  async (importActual) => {
    const mod = await importActual()
    return {
      ...mod,
      getAuthProvider: () => 'defra-id'
    }
  }
)
vi.mock('node:fs')
vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')

describe('#context', () => {
  const mockRequest = { path: '/', logger: { error: vi.fn() } }
  let contextResult
  let context

  beforeEach(async () => {
    vi.resetModules()
    readFileSync.mockClear()
    mockRequest.logger.error.mockClear()
    vi.mocked(getExemptionCache).mockReturnValue({})
    const contextModule =
      await import('~/src/config/nunjucks/context/context.js')
    context = contextModule.context
  })

  describe('When webpack manifest file read succeeds', () => {
    beforeEach(() => {
      readFileSync.mockReturnValue(`{
        "application.js": "javascripts/application.js",
        "stylesheets/application.scss": "stylesheets/application.css"
      }`)
    })

    test('Should provide expected context', () => {
      contextResult = context(mockRequest)
      expect(contextResult).toEqual({
        analyticsEnabled: false,
        assetPath: '/public/assets',
        breadcrumbs: [],
        clarityProjectId: '',
        enableBrowserLogging: true,
        getAssetPath: expect.any(Function),
        isAuthenticated: false,
        navigation: [
          {
            active: false,
            text: 'Home',
            href: '/home'
          },
          {
            active: false,
            text: 'Projects',
            href: '/projects'
          },
          {
            href: '#',
            text: 'Defra account'
          },
          {
            href: '/sign-out',
            text: 'Sign out'
          }
        ],
        serviceName: 'Get permission for marine work',
        serviceUrl: '/'
      })
    })

    test('With valid asset path, should provide expected asset path', () => {
      contextResult = context(mockRequest)
      expect(contextResult.getAssetPath('application.js')).toBe(
        '/public/javascripts/application.js'
      )
    })

    test('With invalid asset path, should provide expected asset', () => {
      contextResult = context(mockRequest)
      expect(contextResult.getAssetPath('an-image.png')).toBe(
        '/public/an-image.png'
      )
    })
  })

  test('When webpack manifest file read fails, should log that the Webpack Manifest file is not available', () => {
    readFileSync.mockImplementation(() => {
      throw new Error('File not found')
    })
    const mockRequestWithLogging = { path: '/', logger: { error: vi.fn() } }
    contextResult = context(mockRequestWithLogging)
    expect(mockRequestWithLogging.logger.error).toHaveBeenCalledWith(
      'Webpack assets-manifest.json not found'
    )
  })

  it('When on the project name page, should not use navigation links', () => {
    const mockRequest = {
      path: '/exemption/project-name',
      logger: { error: vi.fn() }
    }
    const contextResult = context(mockRequest)
    expect(contextResult.navigation).toEqual([])
  })

  test('Should read file on first call', () => {
    readFileSync.mockReturnValue(`{
      "application.js": "javascripts/application.js",
      "stylesheets/application.scss": "stylesheets/application.css"
    }`)
    contextResult = context(mockRequest)
    expect(readFileSync).toHaveBeenCalled()
  })

  test('Should use cache on subsequent calls', () => {
    readFileSync.mockReturnValue(`{
      "application.js": "javascripts/application.js",
      "stylesheets/application.scss": "stylesheets/application.css"
    }`)
    context(mockRequest)
    readFileSync.mockClear()
    contextResult = context(mockRequest)
    expect(readFileSync).not.toHaveBeenCalled()
  })

  test('Should provide expected context', () => {
    contextResult = context(mockRequest)
    expect(contextResult).toEqual(
      expect.objectContaining({
        analyticsEnabled: false,
        assetPath: '/public/assets',
        breadcrumbs: [],
        clarityProjectId: '',
        getAssetPath: expect.any(Function),
        isAuthenticated: false,
        serviceName: 'Get permission for marine work',
        serviceUrl: '/'
      })
    )
  })
})
