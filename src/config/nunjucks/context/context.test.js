import { beforeEach, describe, expect, test, vi, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { getExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

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
vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#context', () => {
  const mockRequest = { path: '/', logger: { error: vi.fn() } }
  let contextResult
  let context

  beforeEach(async () => {
    vi.resetModules()
    readFileSync.mockClear()
    mockRequest.logger.error.mockClear()
    vi.mocked(getExemptionCache).mockReturnValue({})
    vi.mocked(getMarineLicenceCache).mockReturnValue({})
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
        serviceUrl: '/',
        surveyUrls: {
          midJourney: expect.stringContaining('https://'),
          confirmation: expect.stringContaining('https://')
        }
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

  it.each([
    {
      page: 'the project name page',
      path: '/exemption/project-name',
      marineLicenceCache: {}
    },
    {
      page: 'the IAT start page',
      path: '/journey/self-service/start',
      marineLicenceCache: {}
    },
    {
      page: 'the exemption file upload page',
      path: '/exemption/upload-and-wait',
      marineLicenceCache: {}
    },
    {
      page: 'the calculate marine plan policies page',
      path: '/marine-licence/calculate-marine-plan-policies',
      marineLicenceCache: { id: 'some-id' }
    },
    {
      page: 'the marine licence file upload page',
      path: '/marine-licence/upload-and-wait',
      marineLicenceCache: { id: 'some-id' }
    },
    {
      page: 'the water framework directive file upload page',
      path: '/marine-licence/water-framework-directive-upload-and-wait',
      marineLicenceCache: { id: 'some-id' }
    },
    {
      page: 'the marine plan policy guidance page',
      path: '/marine-licence/marine-plan-policy-guidance',
      marineLicenceCache: { id: 'some-id' }
    }
  ])(
    'When on $page, should not use navigation links',
    ({ path, marineLicenceCache }) => {
      vi.mocked(getMarineLicenceCache).mockReturnValue(marineLicenceCache)
      const mockRequest = { path, logger: { error: vi.fn() } }
      const contextResult = context(mockRequest)
      expect(contextResult.navigation).toEqual([])
    }
  )

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

  describe('survey URLs', () => {
    const exemptionMidJourneyUrl =
      'https://forms.office.com/pages/responsepage.aspx?id=UCQKdycCYkyQx044U38RAjXEiYXnHG1DvkWr_VjRfzZUNERIRURNOFNVT0tXSlo1NUdONUYxQjNKUy4u&route=shorturl'
    const marineLicenceMidJourneyUrl =
      'https://forms.cloud.microsoft/e/MHPbixhs4i'

    it.each([
      {
        page: 'a marine licence journey page',
        path: '/marine-licence/project-name',
        expected: marineLicenceMidJourneyUrl
      },
      {
        page: 'the internal user view details page',
        path: '/view-marine-licence-details',
        expected: marineLicenceMidJourneyUrl
      },
      {
        page: 'an exemption journey page',
        path: '/exemption/project-name',
        expected: exemptionMidJourneyUrl
      },
      {
        page: 'a page belonging to neither journey',
        path: '/help/privacy',
        expected: exemptionMidJourneyUrl
      }
    ])(
      'When on $page, should use the matching mid journey survey URL',
      ({ path, expected }) => {
        const request = { path, logger: { error: vi.fn() } }
        expect(context(request).surveyUrls.midJourney).toBe(expected)
      }
    )

    it.each([
      {
        page: 'a marine licence journey page',
        path: '/marine-licence/confirmation',
        expected: 'https://forms.cloud.microsoft/e/vUT96ZvAez'
      },
      {
        page: 'an exemption journey page',
        path: '/exemption/confirmation',
        expected:
          'https://forms.office.com/pages/responsepage.aspx?id=UCQKdycCYkyQx044U38RAjXEiYXnHG1DvkWr_VjRfzZURFMxRkhCSzQyVlRKQzdZNDEyVDhSMFdSNy4u&route=shorturl'
      }
    ])(
      'When on $page, should use the matching confirmation survey URL',
      ({ path, expected }) => {
        const request = { path, logger: { error: vi.fn() } }
        expect(context(request).surveyUrls.confirmation).toBe(expected)
      }
    )

    it('Should use a different survey for the confirmation page and the banner', () => {
      const request = {
        path: '/marine-licence/confirmation',
        logger: { error: vi.fn() }
      }
      const { surveyUrls } = context(request)

      expect(surveyUrls.confirmation).not.toBe(surveyUrls.midJourney)
    })
  })

  it('When session cache throws, should show navigation', () => {
    vi.mocked(getMarineLicenceCache).mockImplementation(() => {
      throw new TypeError('Cannot read properties of null')
    })
    const mockRequest = { path: '/', logger: { error: vi.fn() } }
    const contextResult = context(mockRequest)
    expect(contextResult.navigation).not.toEqual([])
  })
})
