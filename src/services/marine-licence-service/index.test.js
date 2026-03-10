import { vi } from 'vitest'
import { getMarineLicenceService, MarineLicenceService } from './index.js'

describe('marine-licence-service index', () => {
  describe('getMarineLicenceService', () => {
    test('should create and return new MarineLicenceService instance', () => {
      const mockRequest = { logger: { error: vi.fn(), info: vi.fn() } }

      const result = getMarineLicenceService(mockRequest)

      expect(result).toBeInstanceOf(MarineLicenceService)
      expect(result.request).toBe(mockRequest)
    })

    test('should create different instances for different requests', () => {
      const mockRequest1 = { id: 'request1' }
      const mockRequest2 = { id: 'request2' }

      const service1 = getMarineLicenceService(mockRequest1)
      const service2 = getMarineLicenceService(mockRequest2)

      expect(service1).not.toBe(service2)
      expect(service1.request).toBe(mockRequest1)
      expect(service2.request).toBe(mockRequest2)
    })
  })

  describe('MarineLicenceService export', () => {
    test('should export MarineLicenceService class', () => {
      expect(MarineLicenceService).toBeDefined()
      expect(typeof MarineLicenceService).toBe('function')
    })

    test('should be able to instantiate MarineLicenceService directly', () => {
      const mockRequest = { test: 'request' }
      const service = new MarineLicenceService(mockRequest)

      expect(service).toBeInstanceOf(MarineLicenceService)
      expect(service.request).toBe(mockRequest)
    })
  })
})
