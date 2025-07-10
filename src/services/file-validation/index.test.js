import { getFileValidationService, FileValidationService } from './index.js'

describe('#File Validation Service Index', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getFileValidationService factory function', () => {
    test('should create a FileValidationService instance with provided logger', () => {
      // Given
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }

      // When
      const service = getFileValidationService(mockLogger)

      // Then
      expect(service).toBeInstanceOf(FileValidationService)
      expect(service.logger).toBe(mockLogger)
    })

    test('should create a new instance each time it is called', () => {
      // Given
      const mockLogger = { debug: jest.fn() }

      // When
      const service1 = getFileValidationService(mockLogger)
      const service2 = getFileValidationService(mockLogger)

      // Then
      expect(service1).toBeInstanceOf(FileValidationService)
      expect(service2).toBeInstanceOf(FileValidationService)
      expect(service1).not.toBe(service2) // Different instances
    })
  })

  describe('Re-exports', () => {
    test('should re-export FileValidationService class', () => {
      // Given / When / Then
      expect(FileValidationService).toBeDefined()
      expect(typeof FileValidationService).toBe('function')
      expect(FileValidationService.name).toBe('FileValidationService')
    })
  })
})
