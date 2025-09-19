import { context } from '~/src/config/nunjucks/context/context.js'

const mockReadFileSync = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('~/src/server/common/helpers/authenticated-requests.js', () => ({
  ...jest.requireActual(
    '~/src/server/common/helpers/authenticated-requests.js'
  ),
  getAuthProvider: () => 'defra-id'
}))
jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  readFileSync: () => mockReadFileSync()
}))
jest.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

describe('#context', () => {
  const mockRequest = { path: '/' }
  let contextResult

  describe('When webpack manifest file read succeeds', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('~/src/config/nunjucks/context/context.js')
    })

    beforeEach(async () => {
      // Return JSON string
      mockReadFileSync.mockReturnValue(`{
        "application.js": "javascripts/application.js",
        "stylesheets/application.scss": "stylesheets/application.css"
      }`)

      contextResult = await contextImport.context(mockRequest)
    })

    test('Should provide expected context', () => {
      expect(contextResult).toEqual({
        analyticsEnabled: false,
        assetPath: '/public/assets',
        breadcrumbs: [],
        clarityProjectId: '',
        getAssetPath: expect.any(Function),
        isAuthenticated: false,
        navigation: [
          {
            active: false,
            text: 'Projects',
            href: '/home'
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

    describe('With valid asset path', () => {
      test('Should provide expected asset path', () => {
        expect(contextResult.getAssetPath('application.js')).toBe(
          '/public/javascripts/application.js'
        )
      })
    })

    describe('With invalid asset path', () => {
      test('Should provide expected asset', () => {
        expect(contextResult.getAssetPath('an-image.png')).toBe(
          '/public/an-image.png'
        )
      })
    })
  })

  describe('When webpack manifest file read fails', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('~/src/config/nunjucks/context/context.js')
    })

    beforeEach(async () => {
      mockReadFileSync.mockReturnValue(new Error('File not found'))

      contextResult = await contextImport.context(mockRequest)
    })

    test('Should log that the Webpack Manifest file is not available', () => {
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Webpack assets-manifest.json not found'
      )
    })
  })

  describe('When on the project name page', () => {
    it('should not use navigation links', () => {
      const mockRequest = { path: '/exemption/project-name' }
      const contextResult = context(mockRequest)
      expect(contextResult.navigation).toEqual([])
    })
  })
})

describe('#context cache', () => {
  const mockRequest = { path: '/' }
  let contextResult

  describe('Webpack manifest file cache', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('~/src/config/nunjucks/context/context.js')
    })

    beforeEach(() => {
      // Return JSON string
      mockReadFileSync.mockReturnValue(`{
        "application.js": "javascripts/application.js",
        "stylesheets/application.scss": "stylesheets/application.css"
      }`)

      contextResult = contextImport.context(mockRequest)
    })

    test('Should read file', () => {
      expect(mockReadFileSync).toHaveBeenCalled()
    })

    test('Should use cache', () => {
      expect(mockReadFileSync).not.toHaveBeenCalled()
    })

    test('Should provide expected context', () => {
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
})
