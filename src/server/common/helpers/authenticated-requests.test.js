import { vi } from 'vitest'
import Wreck from '@hapi/wreck'
import { config } from '#src/config/config.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPatchRequest,
  authenticatedPutRequest,
  authenticatedRequest,
  getAuthProvider
} from './authenticated-requests.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { getTraceId } from '@defra/hapi-tracing'

vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('@hapi/wreck')
vi.mock('~/src/config/config.js')
vi.mock('@defra/hapi-tracing')

describe('#authenticated-requests', () => {
  let mockRequest
  let mockHeaders

  const getUserSessionMock = vi.mocked(getUserSession)
  const getTraceIdMock = vi.mocked(getTraceId)

  beforeEach(() => {
    mockRequest = {
      state: {
        userSession: {
          sessionId: 'test-session-id'
        }
      },
      auth: {
        credentials: {
          sessionId: 'test-session-id'
        }
      },
      logger: {
        error: vi.fn()
      }
    }

    getUserSessionMock.mockImplementation(() => ({
      token: 'test-token'
    }))

    getTraceIdMock.mockReturnValue(undefined)

    mockHeaders = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token'
    }

    config.get.mockImplementation((key) => {
      if (key === 'backend') {
        return { apiUrl: 'http://localhost:3001' }
      }
      if (key === 'tracing.header') {
        return 'x-cdp-request-id'
      }
      return null
    })
  })

  describe('#authenticatedGetRequest', () => {
    test('should make GET request with auth headers', async () => {
      const mockResponse = { payload: { data: 'test' } }
      Wreck.get.mockResolvedValue(mockResponse)

      const result = await authenticatedGetRequest(
        mockRequest,
        '/test-endpoint'
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })
      expect(Wreck.get).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: mockHeaders,
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })

    test('should still send request without token if it errors when trying to find one', async () => {
      const mockResponse = { payload: { data: 'test' } }
      Wreck.get.mockResolvedValue(mockResponse)

      getUserSessionMock.mockRejectedValueOnce(null)

      const result = await authenticatedGetRequest(
        mockRequest,
        '/test-endpoint'
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })
      expect(Wreck.get).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: { 'Content-Type': 'application/json' },
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })

    test('should still send request without token if it fails to find one', async () => {
      const mockResponse = { payload: { data: 'test' } }
      Wreck.get.mockResolvedValue(mockResponse)

      getUserSessionMock.mockResolvedValueOnce({})

      const result = await authenticatedGetRequest(
        mockRequest,
        '/test-endpoint'
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })
      expect(Wreck.get).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: { 'Content-Type': 'application/json' },
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })

    test('should include additional options', async () => {
      const additionalOptions = { timeout: 5000 }
      Wreck.get.mockResolvedValue({})

      await authenticatedGetRequest(
        mockRequest,
        '/test-endpoint',
        additionalOptions
      )

      expect(Wreck.get).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: mockHeaders,
          json: true,
          timeout: 5000
        }
      )
    })

    test('should include tracing header when getTraceId returns a value', async () => {
      const traceId = 'test-trace-id-123'
      getTraceIdMock.mockReturnValue(traceId)

      const mockResponse = { payload: { data: 'test' } }
      Wreck.get.mockResolvedValue(mockResponse)

      await authenticatedGetRequest(mockRequest, '/test-endpoint')

      expect(Wreck.get).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: {
            ...mockHeaders,
            'x-cdp-request-id': traceId
          },
          json: true
        }
      )
    })
  })

  describe('#authenticatedRequest', () => {
    test('should make DELETE request with auth headers', async () => {
      const mockResponse = { payload: { data: 'test' } }
      Wreck.delete.mockResolvedValue(mockResponse)

      const result = await authenticatedRequest(
        mockRequest,
        'DELETE',
        '/test-endpoint'
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })
      expect(Wreck.delete).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: mockHeaders,
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })

    test('should still send request without token if it errors when trying to find one', async () => {
      const mockResponse = { payload: { data: 'test' } }
      Wreck.delete.mockResolvedValue(mockResponse)

      getUserSessionMock.mockRejectedValueOnce(null)

      const result = await authenticatedRequest(
        mockRequest,
        'DELETE',
        '/test-endpoint'
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })
      expect(Wreck.delete).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: { 'Content-Type': 'application/json' },
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })

    test('should still send request without token if it fails to find one', async () => {
      const mockResponse = { payload: { data: 'test' } }
      Wreck.delete.mockResolvedValue(mockResponse)

      getUserSessionMock.mockResolvedValueOnce({})

      const result = await authenticatedRequest(
        mockRequest,
        'DELETE',
        '/test-endpoint'
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })
      expect(Wreck.delete).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: { 'Content-Type': 'application/json' },
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })

    test('should include additional options', async () => {
      const additionalOptions = { timeout: 5000 }
      Wreck.delete.mockResolvedValue({})

      await authenticatedRequest(
        mockRequest,
        'DELETE',
        '/test-endpoint',
        additionalOptions
      )

      expect(Wreck.delete).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          headers: mockHeaders,
          json: true,
          timeout: 5000
        }
      )
    })
  })

  describe('#authenticatedPostRequest', () => {
    test('should make POST request with auth headers and payload', async () => {
      const mockPayload = { test: 'data' }
      const mockResponse = { payload: { success: true } }
      Wreck.post.mockResolvedValue(mockResponse)

      const result = await authenticatedPostRequest(
        mockRequest,
        '/test-endpoint',
        mockPayload
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })
      expect(Wreck.post).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          payload: mockPayload,
          headers: mockHeaders,
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('#authenticatedPatchRequest', () => {
    test('should make PATCH request with auth headers and payload', async () => {
      const mockPayload = { test: 'data' }
      const mockResponse = { payload: { success: true } }
      Wreck.patch.mockResolvedValue(mockResponse)

      const result = await authenticatedPatchRequest(
        mockRequest,
        '/test-endpoint',
        mockPayload
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })
      expect(Wreck.patch).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          payload: mockPayload,
          headers: mockHeaders,
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('#authenticatedPutRequest', () => {
    test('should make PUT request with auth headers and payload', async () => {
      const mockPayload = { test: 'data' }
      const mockResponse = { payload: { success: true } }
      Wreck.put.mockResolvedValue(mockResponse)

      const result = await authenticatedPutRequest(
        mockRequest,
        '/test-endpoint',
        mockPayload
      )

      expect(getUserSessionMock).toHaveBeenCalledWith(mockRequest, {
        sessionId: 'test-session-id'
      })

      expect(Wreck.put).toHaveBeenCalledWith(
        'http://localhost:3001/test-endpoint',
        {
          payload: mockPayload,
          headers: mockHeaders,
          json: true
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('#getAuthProvider', () => {
    test('should return "entra-id" when strategy is "entra-id"', () => {
      const request = {
        auth: {
          credentials: {
            strategy: 'entra-id'
          }
        }
      }

      const result = getAuthProvider(request)

      expect(result).toBe('entra-id')
    })

    test('should return "defra-id" when strategy is "defra-id"', () => {
      const request = {
        auth: {
          credentials: {
            strategy: 'defra-id'
          }
        }
      }

      const result = getAuthProvider(request)

      expect(result).toBe('defra-id')
    })

    test('should return null when strategy is unknown', () => {
      const request = {
        auth: {
          credentials: {
            strategy: 'unknown-strategy'
          }
        }
      }

      const result = getAuthProvider(request)

      expect(result).toBeNull()
    })

    test('should return null when strategy is undefined', () => {
      const request = {
        auth: {
          credentials: {}
        }
      }

      const result = getAuthProvider(request)

      expect(result).toBeNull()
    })
  })
})
