import { vi } from 'vitest'
import {
  cacheMcmsContextFromQueryParams,
  getMcmsContextFromCache
} from './cache-mcms-context.js'
import { mcmsAnswersDownloadUrl } from '~/src/server/test-helpers/mocks.js'

describe('Cache / get MCMS context', () => {
  let mockRequest
  let logInfo
  const iatQueryString =
    '?ADV_TYPE=EXE&ARTICLE=17&outcomeType=WO_EXE_AVAILABLE_ARTICLE_17&pdfDownloadUrl=https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f&ACTIVITY_TYPE=CON&EXE_ACTIVITY_SUBTYPE_CON=scientificResearch'

  beforeEach(() => {
    logInfo = vi.fn()
    mockRequest = {
      path: '/',
      query: {},
      url: `http://example.com/${iatQueryString}`,
      raw: {
        req: {
          url: `/${iatQueryString}`
        }
      },
      yar: {
        flash: vi.fn()
      },
      logger: {
        info: logInfo
      }
    }
  })

  describe('cacheMcmsContextFromQueryParams', () => {
    it('should cache valid query params with iatQueryString, and ignore others', () => {
      cacheMcmsContextFromQueryParams({
        ...mockRequest,
        query: {
          ADV_TYPE: 'EXE',
          outcomeType: 'WO_EXE_AVAILABLE_ARTICLE',
          EXE_ACTIVITY_SUBTYPE_DEPOSIT: 'scientificResearch',
          ACTIVITY_TYPE: 'INCINERATION',
          ARTICLE: '34',
          pdfDownloadUrl: mcmsAnswersDownloadUrl
        }
      })

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext', {
        activityType: 'INCINERATION',
        article: '34',
        pdfDownloadUrl: mcmsAnswersDownloadUrl,
        iatQueryString
      })
      expect(logInfo).not.toHaveBeenCalled()
    })

    it('should info log and cache iatQueryString when validation fails', () => {
      mockRequest.query = {
        ACTIVITY_TYPE: 'INVALID_TYPE',
        ARTICLE: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext', {
        iatQueryString
      })
      expect(logInfo).toHaveBeenCalledWith(
        `Missing or invalid MCMS query string context on URL: http://example.com/${iatQueryString} - "ACTIVITY_TYPE" must be one of [CON, DEPOSIT, REMOVAL, DREDGE, INCINERATION, EXPLOSIVES, SCUTTLING]`
      )
    })

    it('should do nothing when not on root path', () => {
      mockRequest.path = '/some-other-path'

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.flash).not.toHaveBeenCalled()
    })

    it('should not cache MCMS context if no querystring', () => {
      cacheMcmsContextFromQueryParams({
        ...mockRequest,
        query: {},
        url: 'http://example.com/',
        raw: { req: { url: '/' } }
      })

      expect(mockRequest.yar.flash).not.toHaveBeenCalled()
      expect(logInfo).toHaveBeenCalledWith(
        'Missing or invalid MCMS query string context on URL: http://example.com/ - "ACTIVITY_TYPE" is required'
      )
    })
  })

  describe('getMcmsContextFromCache', () => {
    it('should return cached MCMS context when available', () => {
      const cachedContext = {
        activityType: 'CON',
        article: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl,
        iatQueryString: 'ACTIVITY_TYPE=CON&ARTICLE=17'
      }

      mockRequest.yar.flash.mockReturnValue([cachedContext])

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext')
      expect(result).toEqual(cachedContext)
      expect(logInfo).not.toHaveBeenCalled()
    })

    it('should return null and log error when no cached context', () => {
      mockRequest.yar.flash.mockReturnValue([])

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext')
      expect(result).toBeNull()
      expect(logInfo).toHaveBeenCalledWith(
        `No MCMS context cached for URL: ${mockRequest.url}`
      )
    })

    it('should return first context and log error when multiple cached contexts', () => {
      const firstContext = {
        activityType: 'CON',
        article: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl,
        iatQueryString: 'ACTIVITY_TYPE=CON&ARTICLE=17'
      }
      const secondContext = {
        activityType: 'DEPOSIT',
        article: '18A',
        pdfDownloadUrl: mcmsAnswersDownloadUrl,
        iatQueryString: 'ACTIVITY_TYPE=DEPOSIT&ARTICLE=18A'
      }

      mockRequest.yar.flash.mockReturnValue([firstContext, secondContext])

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext')
      expect(result).toEqual(firstContext)
      expect(logInfo).toHaveBeenCalledWith(
        `Multiple MCMS contexts cached for URL: ${mockRequest.url}`
      )
    })
  })
})
