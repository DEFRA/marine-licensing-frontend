import { vi } from 'vitest'
import { ExemptionService } from './exemption.service.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { mockExemption } from '#src/server/test-helpers/mocks.js'

vi.mock('~/src/server/common/helpers/logging/logger.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('ExemptionService', () => {
  let service
  let mockRequest
  let mockLogger
  let mockAuthenticatedGetRequest

  beforeEach(() => {
    mockRequest = {
      logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn()
      }
    }

    mockLogger = {
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    }

    mockAuthenticatedGetRequest = vi.mocked(authenticatedGetRequest)
    vi.mocked(createLogger).mockReturnValue(mockLogger)
  })

  describe('constructor', () => {
    test('should initialize with provided request and default logger', () => {
      service = new ExemptionService(mockRequest)

      expect(service.request).toBe(mockRequest)
      expect(service.logger).toBe(mockLogger)
      expect(createLogger).toHaveBeenCalled()
    })

    test('should initialize with provided request and custom logger', () => {
      const customLogger = { error: vi.fn(), info: vi.fn() }
      service = new ExemptionService(mockRequest, customLogger)

      expect(service.request).toBe(mockRequest)
      expect(service.logger).toBe(customLogger)
      expect(createLogger).not.toHaveBeenCalled()
    })
  })

  describe('getExemptionById', () => {
    beforeEach(() => {
      service = new ExemptionService(mockRequest, mockLogger)
    })

    describe('successful scenarios', () => {
      test('should return exemption data for valid ID', async () => {
        const exemptionId = '507f1f77bcf86cd799439011'
        const expectedExemption = {
          id: exemptionId,
          projectName: 'Test Project',
          status: 'Draft',
          mcmsContext: null
        }

        mockAuthenticatedGetRequest.mockResolvedValue({
          payload: {
            message: 'success',
            value: expectedExemption
          }
        })

        const result = await service.getExemptionById(exemptionId)

        expect(mockAuthenticatedGetRequest).toHaveBeenCalledWith(
          mockRequest,
          `/exemption/${exemptionId}`
        )
        expect(result).toEqual(expectedExemption)
        expect(mockLogger.error).not.toHaveBeenCalled()
      })

      test('should return exemption', async () => {
        const exemptionId = '507f1f77bcf86cd799439012'

        mockAuthenticatedGetRequest.mockResolvedValue({
          payload: {
            message: 'success',
            value: mockExemption
          }
        })

        const result = await service.getExemptionById(exemptionId)

        expect(result).toEqual({
          ...mockExemption,
          mcmsContext: {
            ...mockExemption.mcmsContext,
            activity: {
              label: 'Deposit of a substance or object',
              purpose: 'Scientific instruments and associated equipment',
              code: 'DEPOSIT',
              subType: 'scientificResearch'
            }
          }
        })
      })

      describe('validation errors', () => {
        test('should throw error when ID is null', async () => {
          await expect(service.getExemptionById(null)).rejects.toThrow(
            errorMessages.EXEMPTION_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: null },
            errorMessages.EXEMPTION_NOT_FOUND
          )
          expect(mockAuthenticatedGetRequest).not.toHaveBeenCalled()
        })

        test('should throw error when ID is undefined', async () => {
          await expect(service.getExemptionById(undefined)).rejects.toThrow(
            errorMessages.EXEMPTION_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: undefined },
            errorMessages.EXEMPTION_NOT_FOUND
          )
          expect(mockAuthenticatedGetRequest).not.toHaveBeenCalled()
        })

        test('should throw error when ID is empty string', async () => {
          await expect(service.getExemptionById('')).rejects.toThrow(
            errorMessages.EXEMPTION_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: '' },
            errorMessages.EXEMPTION_NOT_FOUND
          )
          expect(mockAuthenticatedGetRequest).not.toHaveBeenCalled()
        })
      })

      describe('API response errors', () => {
        const validId = '507f1f77bcf86cd799439011'

        test('should throw error when API response message is not success', async () => {
          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              message: 'error',
              value: null
            }
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: validId },
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })

        test('should throw error when API response has no message property', async () => {
          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              value: { id: validId }
            }
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: validId },
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })

        test('should throw error when API response value is null', async () => {
          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              message: 'success',
              value: null
            }
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: validId },
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })

        test('should throw error when API response value is undefined', async () => {
          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              message: 'success'
            }
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: validId },
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })

        test('should throw error when API response payload is null', async () => {
          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: null
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: validId },
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })

        test('should throw error when API response payload is undefined', async () => {
          mockAuthenticatedGetRequest.mockResolvedValue({})

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: validId },
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })
      })

      describe('network and API errors', () => {
        const validId = '507f1f77bcf86cd799439011'

        test('should propagate network errors from authenticatedGetRequest', async () => {
          const networkError = new Error('Network timeout')
          mockAuthenticatedGetRequest.mockRejectedValue(networkError)

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            'Network timeout'
          )

          expect(mockAuthenticatedGetRequest).toHaveBeenCalledWith(
            mockRequest,
            `/exemption/${validId}`
          )
        })

        test('should propagate authentication errors', async () => {
          const authError = new Error('Unauthorized')
          mockAuthenticatedGetRequest.mockRejectedValue(authError)

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            'Unauthorized'
          )
        })

        test('should propagate server errors', async () => {
          const serverError = new Error('Internal Server Error')
          mockAuthenticatedGetRequest.mockRejectedValue(serverError)

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            'Internal Server Error'
          )
        })
      })

      describe('edge cases', () => {
        test('should handle API response with false value', async () => {
          const validId = '507f1f77bcf86cd799439011'

          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              message: 'success',
              value: false
            }
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })

        test('should handle API response with zero value', async () => {
          const validId = '507f1f77bcf86cd799439011'

          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              message: 'success',
              value: 0
            }
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })

        test('should handle API response with empty string value', async () => {
          const validId = '507f1f77bcf86cd799439011'

          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              message: 'success',
              value: ''
            }
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow(
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
        })
      })

      describe('logging behavior', () => {
        const validId = '507f1f77bcf86cd799439011'

        test('should log error with correct context for invalid ID', async () => {
          const invalidId = null

          await expect(service.getExemptionById(invalidId)).rejects.toThrow()

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: invalidId },
            errorMessages.EXEMPTION_NOT_FOUND
          )
          expect(mockLogger.error).toHaveBeenCalledTimes(1)
        })

        test('should log error with correct context for API failure', async () => {
          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              message: 'error',
              value: null
            }
          })

          await expect(service.getExemptionById(validId)).rejects.toThrow()

          expect(mockLogger.error).toHaveBeenCalledWith(
            { id: validId },
            errorMessages.EXEMPTION_DATA_NOT_FOUND
          )
          expect(mockLogger.error).toHaveBeenCalledTimes(1)
        })

        test('should not log errors for successful requests', async () => {
          const exemption = { id: validId, projectName: 'Test' }

          mockAuthenticatedGetRequest.mockResolvedValue({
            payload: {
              message: 'success',
              value: exemption
            }
          })

          await service.getExemptionById(validId)

          expect(mockLogger.error).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('getPublicExemptionById', () => {
    beforeEach(() => {
      service = new ExemptionService(mockRequest, mockLogger)
    })

    describe('successful scenarios', () => {
      test('should return exemption data for valid ID using public endpoint', async () => {
        const exemptionId = '507f1f77bcf86cd799439011'
        const expectedExemption = {
          id: exemptionId,
          projectName: 'Test Project',
          status: 'Submitted'
        }

        mockAuthenticatedGetRequest.mockResolvedValue({
          payload: {
            message: 'success',
            value: expectedExemption
          }
        })

        const result = await service.getPublicExemptionById(exemptionId)

        expect(mockAuthenticatedGetRequest).toHaveBeenCalledWith(
          mockRequest,
          `/public/exemption/${exemptionId}`
        )
        expect(result).toEqual(expectedExemption)
        expect(mockLogger.error).not.toHaveBeenCalled()
      })
    })

    describe('validation errors', () => {
      test('should throw error when ID is null', async () => {
        await expect(service.getPublicExemptionById(null)).rejects.toThrow(
          errorMessages.EXEMPTION_NOT_FOUND
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          { id: null },
          errorMessages.EXEMPTION_NOT_FOUND
        )
        expect(mockAuthenticatedGetRequest).not.toHaveBeenCalled()
      })

      test('should throw error when ID is undefined', async () => {
        await expect(service.getPublicExemptionById(undefined)).rejects.toThrow(
          errorMessages.EXEMPTION_NOT_FOUND
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          { id: undefined },
          errorMessages.EXEMPTION_NOT_FOUND
        )
        expect(mockAuthenticatedGetRequest).not.toHaveBeenCalled()
      })

      test('should throw error when ID is empty string', async () => {
        await expect(service.getPublicExemptionById('')).rejects.toThrow(
          errorMessages.EXEMPTION_NOT_FOUND
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          { id: '' },
          errorMessages.EXEMPTION_NOT_FOUND
        )
        expect(mockAuthenticatedGetRequest).not.toHaveBeenCalled()
      })
    })

    describe('API response errors', () => {
      const validId = '507f1f77bcf86cd799439011'

      test('should throw error when API response message is not success', async () => {
        mockAuthenticatedGetRequest.mockResolvedValue({
          payload: {
            message: 'error',
            value: null
          }
        })

        await expect(service.getPublicExemptionById(validId)).rejects.toThrow(
          errorMessages.EXEMPTION_DATA_NOT_FOUND
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          { id: validId },
          errorMessages.EXEMPTION_DATA_NOT_FOUND
        )
      })

      test('should throw error when API response value is null', async () => {
        mockAuthenticatedGetRequest.mockResolvedValue({
          payload: {
            message: 'success',
            value: null
          }
        })

        await expect(service.getPublicExemptionById(validId)).rejects.toThrow(
          errorMessages.EXEMPTION_DATA_NOT_FOUND
        )
      })
    })

    describe('network errors', () => {
      test('should propagate network errors from authenticatedGetRequest', async () => {
        const validId = '507f1f77bcf86cd799439011'
        const networkError = new Error('Network timeout')
        mockAuthenticatedGetRequest.mockRejectedValue(networkError)

        await expect(service.getPublicExemptionById(validId)).rejects.toThrow(
          'Network timeout'
        )

        expect(mockAuthenticatedGetRequest).toHaveBeenCalledWith(
          mockRequest,
          `/public/exemption/${validId}`
        )
      })
    })
  })
})
