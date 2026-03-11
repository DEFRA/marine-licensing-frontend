import { vi } from 'vitest'
import { MarineLicenceService } from './marine-licence.service.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/helpers/logging/logger.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('MarineLicenceService', () => {
  let service
  let mockRequest
  let mockLogger

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

    vi.mocked(createLogger).mockReturnValue(mockLogger)
  })

  describe('constructor', () => {
    test('should initialise with provided request and default logger', () => {
      service = new MarineLicenceService(mockRequest)

      expect(service.request).toBe(mockRequest)
      expect(service.logger).toBe(mockLogger)
      expect(createLogger).toHaveBeenCalled()
    })

    test('should initialise with provided request and custom logger', () => {
      const customLogger = { error: vi.fn(), info: vi.fn() }
      service = new MarineLicenceService(mockRequest, customLogger)

      expect(service.request).toBe(mockRequest)
      expect(service.logger).toBe(customLogger)
      expect(createLogger).not.toHaveBeenCalled()
    })
  })

  describe('getMarineLicenceById', () => {
    const validId = '507f1f77bcf86cd799439011'

    beforeEach(() => {
      service = new MarineLicenceService(mockRequest, mockLogger)
    })

    describe('successful scenarios', () => {
      test('should return marine licence data for valid ID', async () => {
        const expectedMarineLicence = {
          id: validId,
          projectName: 'Test Project',
          applicationReference: 'ML/2024/12345'
        }

        vi.mocked(authenticatedGetRequest).mockResolvedValue({
          payload: { message: 'success', value: expectedMarineLicence }
        })

        const result = await service.getMarineLicenceById(validId)

        expect(authenticatedGetRequest).toHaveBeenCalledWith(
          mockRequest,
          `/marine-licence/${validId}`
        )
        expect(result).toEqual(expectedMarineLicence)
        expect(mockLogger.error).not.toHaveBeenCalled()
      })
    })

    describe('invalid ID validation', () => {
      test.each([
        ['null', null],
        ['undefined', undefined],
        ['empty string', '']
      ])('should throw when ID is %s', async (_label, invalidId) => {
        await expect(service.getMarineLicenceById(invalidId)).rejects.toThrow(
          errorMessages.MARINE_LICENCE_NOT_FOUND
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          { id: invalidId },
          errorMessages.MARINE_LICENCE_NOT_FOUND
        )
        expect(authenticatedGetRequest).not.toHaveBeenCalled()
      })
    })

    describe('API response errors', () => {
      test.each([
        [
          'message is not success',
          { payload: { message: 'error', value: null } }
        ],
        ['value is null', { payload: { message: 'success', value: null } }],
        ['value is undefined', { payload: { message: 'success' } }],
        ['payload is null', { payload: null }],
        ['payload is undefined', {}]
      ])('should throw when %s', async (_label, apiResponse) => {
        vi.mocked(authenticatedGetRequest).mockResolvedValue(apiResponse)

        await expect(service.getMarineLicenceById(validId)).rejects.toThrow(
          errorMessages.MARINE_LICENCE_DATA_NOT_FOUND
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
          { id: validId },
          errorMessages.MARINE_LICENCE_DATA_NOT_FOUND
        )
      })
    })

    describe('network errors', () => {
      test.each([
        ['network timeout', new Error('Network timeout')],
        ['auth error', new Error('Unauthorized')],
        ['server error', new Error('Internal Server Error')]
      ])('should propagate %s', async (_label, error) => {
        vi.mocked(authenticatedGetRequest).mockRejectedValue(error)

        await expect(service.getMarineLicenceById(validId)).rejects.toThrow(
          error.message
        )

        expect(authenticatedGetRequest).toHaveBeenCalledWith(
          mockRequest,
          `/marine-licence/${validId}`
        )
      })
    })

    describe('logging behaviour', () => {
      test('should not log errors for successful requests', async () => {
        vi.mocked(authenticatedGetRequest).mockResolvedValue({
          payload: {
            message: 'success',
            value: { id: validId, projectName: 'Test' }
          }
        })

        await service.getMarineLicenceById(validId)

        expect(mockLogger.error).not.toHaveBeenCalled()
      })

      test('should log once for invalid ID', async () => {
        await expect(service.getMarineLicenceById(null)).rejects.toThrow()

        expect(mockLogger.error).toHaveBeenCalledTimes(1)
      })

      test('should log once for bad API response', async () => {
        vi.mocked(authenticatedGetRequest).mockResolvedValue({
          payload: { message: 'error', value: null }
        })

        await expect(service.getMarineLicenceById(validId)).rejects.toThrow()

        expect(mockLogger.error).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getPublicMarineLicenceById', () => {
    const validId = '507f1f77bcf86cd799439011'

    beforeEach(() => {
      service = new MarineLicenceService(mockRequest, mockLogger)
    })

    describe('successful scenarios', () => {
      test('should return marine licence data for valid ID using public endpoint', async () => {
        const expectedMarineLicence = {
          id: validId,
          projectName: 'Test Project',
          applicationReference: 'ML/2024/12345'
        }

        vi.mocked(authenticatedGetRequest).mockResolvedValue({
          payload: {
            message: 'success',
            value: expectedMarineLicence
          }
        })

        const result = await service.getPublicMarineLicenceById(validId)

        expect(authenticatedGetRequest).toHaveBeenCalledWith(
          mockRequest,
          `/public/marine-licence/${validId}`
        )
        expect(result).toEqual(expectedMarineLicence)
        expect(mockLogger.error).not.toHaveBeenCalled()
      })
    })

    describe('invalid ID validation', () => {
      test.each([
        ['null', null],
        ['undefined', undefined],
        ['empty string', '']
      ])('should throw when ID is %s', async (_label, invalidId) => {
        await expect(
          service.getPublicMarineLicenceById(invalidId)
        ).rejects.toThrow(errorMessages.MARINE_LICENCE_NOT_FOUND)

        expect(mockLogger.error).toHaveBeenCalledWith(
          { id: invalidId },
          errorMessages.MARINE_LICENCE_NOT_FOUND
        )
        expect(authenticatedGetRequest).not.toHaveBeenCalled()
      })
    })

    describe('API response errors', () => {
      test('should throw error when API response message is not success', async () => {
        vi.mocked(authenticatedGetRequest).mockResolvedValue({
          payload: {
            message: 'error',
            value: null
          }
        })

        await expect(
          service.getPublicMarineLicenceById(validId)
        ).rejects.toThrow(errorMessages.MARINE_LICENCE_DATA_NOT_FOUND)

        expect(mockLogger.error).toHaveBeenCalledWith(
          { id: validId },
          errorMessages.MARINE_LICENCE_DATA_NOT_FOUND
        )
      })

      test('should throw error when API response value is null', async () => {
        vi.mocked(authenticatedGetRequest).mockResolvedValue({
          payload: {
            message: 'success',
            value: null
          }
        })

        await expect(
          service.getPublicMarineLicenceById(validId)
        ).rejects.toThrow(errorMessages.MARINE_LICENCE_DATA_NOT_FOUND)
      })
    })

    describe('network errors', () => {
      test('should propagate network errors from authenticatedGetRequest', async () => {
        const networkError = new Error('Network timeout')
        vi.mocked(authenticatedGetRequest).mockRejectedValue(networkError)

        await expect(
          service.getPublicMarineLicenceById(validId)
        ).rejects.toThrow('Network timeout')

        expect(authenticatedGetRequest).toHaveBeenCalledWith(
          mockRequest,
          `/public/marine-licence/${validId}`
        )
      })
    })
  })
})
