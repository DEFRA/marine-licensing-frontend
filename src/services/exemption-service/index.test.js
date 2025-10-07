import { vi } from 'vitest'
import { getExemptionService, ExemptionService } from './index.js'

describe('exemption-service index', () => {
  describe('getExemptionService', () => {
    test('should create and return new ExemptionService instance', () => {
      const mockRequest = {
        logger: {
          error: vi.fn(),
          info: vi.fn()
        }
      }

      const result = getExemptionService(mockRequest)

      expect(result).toBeInstanceOf(ExemptionService)
      expect(result.request).toBe(mockRequest)
    })

    test('should create different instances for different requests', () => {
      const mockRequest1 = { id: 'request1' }
      const mockRequest2 = { id: 'request2' }

      const service1 = getExemptionService(mockRequest1)
      const service2 = getExemptionService(mockRequest2)

      expect(service1).not.toBe(service2)
      expect(service1.request).toBe(mockRequest1)
      expect(service2.request).toBe(mockRequest2)
    })

    test('should handle null request', () => {
      const result = getExemptionService(null)

      expect(result).toBeInstanceOf(ExemptionService)
      expect(result.request).toBeNull()
    })

    test('should handle undefined request', () => {
      const result = getExemptionService(undefined)

      expect(result).toBeInstanceOf(ExemptionService)
      expect(result.request).toBeUndefined()
    })
  })

  describe('ExemptionService export', () => {
    test('should export ExemptionService class', () => {
      expect(ExemptionService).toBeDefined()
      expect(typeof ExemptionService).toBe('function')
    })

    test('should be able to instantiate ExemptionService directly', () => {
      const mockRequest = { test: 'request' }
      const service = new ExemptionService(mockRequest)

      expect(service).toBeInstanceOf(ExemptionService)
      expect(service.request).toBe(mockRequest)
    })
  })
})
