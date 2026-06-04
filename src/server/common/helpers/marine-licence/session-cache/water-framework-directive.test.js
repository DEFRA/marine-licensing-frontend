import { updateWaterFrameworkDirective } from './water-framework-directive'
import { MARINE_LICENCE_CACHE_KEY } from './utils'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

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
