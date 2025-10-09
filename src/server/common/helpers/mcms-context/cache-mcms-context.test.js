import { vi } from 'vitest'
import {
  cacheMcmsContextFromQueryParams,
  getMcmsContextFromCache
} from './cache-mcms-context.js'
import { mcmsAnswersDownloadUrl } from '~/src/server/test-helpers/mocks.js'

describe('Cache / get MCMS context', () => {
  let mockRequest
  let logError

  beforeEach(() => {
    logError = vi.fn()
    mockRequest = {
      path: '/',
      query: {},
      url: 'http://example.com/?ACTIVITY_TYPE=CON&ARTICLE=17',
      yar: {
        flash: vi.fn()
      },
      logger: {
        error: logError
      }
    }
  })

  describe('cacheMcmsContextFromQueryParams', () => {
    it('should cache valid query params on root path', () => {
      mockRequest.query = {
        ACTIVITY_TYPE: 'CON',
        ARTICLE: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl,
        EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: 'maintenance'
      }

      cacheMcmsContextFromQueryParams(mockRequest)

      const expectedTransformedValue = {
        activityType: 'CON',
        activitySubtype: 'maintenance',
        article: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        'mcmsContext',
        expectedTransformedValue
      )
      expect(logError).not.toHaveBeenCalled()
    })

    it('should log error and not cache when validation fails', () => {
      mockRequest.query = {
        ACTIVITY_TYPE: 'INVALID_TYPE',
        ARTICLE: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.flash).not.toHaveBeenCalled()
      expect(logError.mock.calls[0][1]).toBe(
        'Missing or invalid MCMS query string context on URL: http://example.com/?ACTIVITY_TYPE=CON&ARTICLE=17 - "ACTIVITY_TYPE" must be one of [CON, DEPOSIT, REMOVAL, DREDGE, INCINERATION, EXPLOSIVES, SCUTTLING]'
      )
    })

    it('should do nothing when not on root path', () => {
      mockRequest.path = '/some-other-path'

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.flash).not.toHaveBeenCalled()
    })

    it('should handle empty query params', () => {
      mockRequest.query = {}

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.flash).not.toHaveBeenCalled()
      expect(logError.mock.calls[0][1]).toBe(
        'Missing or invalid MCMS query string context on URL: http://example.com/?ACTIVITY_TYPE=CON&ARTICLE=17 - "ACTIVITY_TYPE" is required'
      )
    })

    it("should cache valid query params without subtype if the activity type doesn't require one", () => {
      mockRequest.query = {
        ACTIVITY_TYPE: 'INCINERATION',
        ARTICLE: '34',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }

      cacheMcmsContextFromQueryParams(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext', {
        activityType: 'INCINERATION',
        article: '34',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      })
    })
  })

  describe('getMcmsContextFromCache', () => {
    it('should return cached MCMS context when available', () => {
      const cachedContext = {
        activityType: 'CON',
        activitySubtype: 'maintenance',
        article: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }

      mockRequest.yar.flash.mockReturnValue([cachedContext])

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext')
      expect(result).toEqual(cachedContext)
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return null and log error when no cached context', () => {
      mockRequest.yar.flash.mockReturnValue([])

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext')
      expect(result).toBeNull()
      expect(logError).toHaveBeenCalledWith(
        `Missing MCMS query string context on URL: ${mockRequest.url}`
      )
    })

    it('should return first context and log error when multiple cached contexts', () => {
      const firstContext = {
        activityType: 'CON',
        activitySubtype: 'maintenance',
        article: '17',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }
      const secondContext = {
        activityType: 'DEPOSIT',
        activitySubtype: 'dredgedMaterial',
        article: '18A',
        pdfDownloadUrl: mcmsAnswersDownloadUrl
      }

      mockRequest.yar.flash.mockReturnValue([firstContext, secondContext])

      const result = getMcmsContextFromCache(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext')
      expect(result).toEqual(firstContext)
      expect(logError).toHaveBeenCalledWith(
        `Multiple MCMS contexts cached for URL: ${mockRequest.url}`
      )
    })
  })
})
