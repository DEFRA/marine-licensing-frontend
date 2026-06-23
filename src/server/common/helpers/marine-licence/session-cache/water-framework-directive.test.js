import {
  clearWaterFrameworkDirectiveReturnToCache,
  getWaterFrameworkDirectiveReturnRoute,
  setWaterFrameworkDirectiveReturnToCache,
  updateWaterFrameworkDirective
} from './water-framework-directive'
import { MARINE_LICENCE_CACHE_KEY } from './utils'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import { WFD_RETURN_TO_KEY } from '#src/server/common/constants/cache.js'

describe('updateWaterFrameworkDirective', () => {
  let mockRequest
  const mockH = createMockH()

  beforeEach(() => {
    mockRequest = {
      yar: {
        clear: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue()
      }
    }
  })

  test('should store the value in cache', async () => {
    const value = { nauticalMile: 'yes' }

    const result = await updateWaterFrameworkDirective(
      mockRequest,
      mockH,
      'nauticalMile',
      value.nauticalMile
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(MARINE_LICENCE_CACHE_KEY, {
      waterFrameworkDirective: { nauticalMile: 'yes' }
    })
    expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    expect(result).toEqual({ nauticalMile: 'yes' })
  })

  test('should handle empty objects', async () => {
    const value = {}

    const result = await updateWaterFrameworkDirective(
      mockRequest,
      mockH,
      'nauticalMile',
      value.nauticalMile
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(MARINE_LICENCE_CACHE_KEY, {
      waterFrameworkDirective: {}
    })
    expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    expect(result).toEqual({ nauticalMile: null })
  })

  test('should handle undefined values and convert to null', async () => {
    const value = undefined

    const result = await updateWaterFrameworkDirective(
      mockRequest,
      mockH,
      'nauticalMile',
      value
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(MARINE_LICENCE_CACHE_KEY, {
      waterFrameworkDirective: {}
    })
    expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

    expect(result).toEqual({ nauticalMile: null })
  })

  test('should handle null values correctly', async () => {
    const value = null

    const result = await updateWaterFrameworkDirective(
      mockRequest,
      mockH,
      'nauticalMile',
      value
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(MARINE_LICENCE_CACHE_KEY, {
      waterFrameworkDirective: {}
    })
    expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

    expect(result).toEqual({ nauticalMile: null })
  })
})

describe('setWaterFrameworkDirectiveReturnToCache', () => {
  test('sets the WFD_RETURN_TO_KEY cache key', async () => {
    const mockRequest = createMockRequest()
    const mockH = createMockH()

    await setWaterFrameworkDirectiveReturnToCache(mockRequest, mockH, '/test')

    expect(mockRequest.yar.set).toHaveBeenCalledWith(WFD_RETURN_TO_KEY, '/test')
    expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
  })
})

describe('clearWaterFrameworkDirectiveReturnToCache', () => {
  test('clears the WFD_RETURN_TO_KEY cache key', () => {
    const mockRequest = createMockRequest()
    clearWaterFrameworkDirectiveReturnToCache(mockRequest)
    expect(mockRequest.yar.clear).toHaveBeenCalledWith(WFD_RETURN_TO_KEY)
  })
})

describe('getWaterFrameworkDirectiveReturnRoute', () => {
  test('gets the WFD_RETURN_TO_KEY cache key value', () => {
    const mockRequest = createMockRequest()

    getWaterFrameworkDirectiveReturnRoute(mockRequest)

    expect(mockRequest.yar.get).toHaveBeenCalledWith(WFD_RETURN_TO_KEY)
  })
})
