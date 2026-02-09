import { describe, test, expect, beforeEach } from 'vitest'
import {
  cacheMcmsContextFromQueryParams,
  getMcmsContextFromCache,
  clearMcmsContextCache
} from './cache-mcms-context.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { mcmsAnswersDownloadUrl } from '#src/server/test-helpers/mocks/mcms.js'

describe('cache-mcms-context', () => {
  const iatQueryString =
    '?ADV_TYPE=EXE&ARTICLE=17&outcomeType=WO_EXE_AVAILABLE_ARTICLE_17&pdfDownloadUrl=https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f&ACTIVITY_TYPE=CON&EXE_ACTIVITY_SUBTYPE_CON=scientificResearch'

  describe('cacheMcmsContextFromQueryParams', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest({
        path: '/',
        url: `http://example.com/${iatQueryString}`,
        raw: {
          req: {
            url: `/${iatQueryString}`
          }
        }
      })
    })

    test('should cache valid query params with iatQueryString, and ignore others', () => {
      mockRequest.query = {
        ADV_TYPE: 'EXE',
        outcomeType: 'WO_EXE_AVAILABLE_ARTICLE',
        EXE_ACTIVITY_SUBTYPE_DEPOSIT: 'scientificResearch',
        ACTIVITY_TYPE: 'INCINERATION',
        ARTICLE: '34',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('mcmsContext', {
        activityType: 'INCINERATION',
        article: '34',
        pdfDownloadUrl: mcmsAnswersDownloadUrl,
        iatQueryString
      })
      expect(mockRequest.logger.info).toHaveBeenCalledTimes(1)
    })

    test('should log info and cache iatQueryString when validation fails', () => {
      mockRequest.query = {
        ACTIVITY_TYPE: 'INVALID_TYPE',
        ARTICLE: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('mcmsContext', {
        iatQueryString
      })
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        `Missing or invalid MCMS query string context on URL: http://example.com/${iatQueryString} - "ACTIVITY_TYPE" must be one of [CON, DEPOSIT, REMOVAL, DREDGE, INCINERATION, EXPLOSIVES, SCUTTLING]`
      )
    })

    test('should not cache MCMS context when no query params', () => {
      mockRequest.query = {}
      mockRequest.url = 'http://example.com/'
      mockRequest.raw.req.url = '/'

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.set).not.toHaveBeenCalled()
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        'Missing or invalid MCMS query string context on URL: http://example.com/ - "ACTIVITY_TYPE" is required'
      )
    })

    test('should cache iatQueryString when validation fails but query params exist', () => {
      mockRequest.query = {
        ARTICLE: '17'
      }

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('mcmsContext', {
        iatQueryString
      })
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Missing or invalid MCMS query string context')
      )
    })
  })

  describe('getMcmsContextFromCache', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest({
        url: 'http://example.com/test'
      })
    })

    test('should return cached MCMS context', () => {
      const cachedContext = {
        activityType: 'CON',
        article: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl,
        iatQueryString: 'ACTIVITY_TYPE=CON&ARTICLE=17'
      }

      mockRequest.yar.get.mockReturnValue(cachedContext)

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith('mcmsContext')
      expect(result).toEqual(cachedContext)
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        'getMcmsContextFromCache: {"activityType":"CON","article":"17","pdfDownloadUrl":"https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f","iatQueryString":"ACTIVITY_TYPE=CON&ARTICLE=17"}'
      )
    })

    test('should return null and log info when no cached context', () => {
      mockRequest.yar.get.mockReturnValue(null)

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith('mcmsContext')
      expect(result).toBeNull()
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        'getMcmsContextFromCache: null'
      )
    })

    test('should return null and log info when cached context is undefined', () => {
      mockRequest.yar.get.mockReturnValue(undefined)

      const result = getMcmsContextFromCache(mockRequest)

      expect(result).toBeNull()
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        'getMcmsContextFromCache: undefined'
      )
    })

    test('should still return value when empty object is cached', () => {
      mockRequest.yar.get.mockReturnValue({})

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith('mcmsContext')
      expect(result).toEqual({})
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        'getMcmsContextFromCache: {}'
      )
    })
  })

  describe('clearMcmsContextCache', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest()
    })

    test('should clear MCMS context from cache', () => {
      clearMcmsContextCache(mockRequest)

      expect(mockRequest.yar.clear).toHaveBeenCalledWith('mcmsContext')
    })

    test('should clear cache even when no context exists', () => {
      mockRequest.yar.get.mockReturnValue(null)

      clearMcmsContextCache(mockRequest)

      expect(mockRequest.yar.clear).toHaveBeenCalledWith('mcmsContext')
    })

    test('should clear cache when context exists', () => {
      mockRequest.yar.get.mockReturnValue({
        activityType: 'CON',
        article: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      })

      clearMcmsContextCache(mockRequest)

      expect(mockRequest.yar.clear).toHaveBeenCalledWith('mcmsContext')
    })
  })
})
