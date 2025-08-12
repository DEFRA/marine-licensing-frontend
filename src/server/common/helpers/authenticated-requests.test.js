import Wreck from '@hapi/wreck'
import { config } from '~/src/config/config.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPatchRequest,
  authenticatedPutRequest,
  authenticatedRequest
} from './authenticated-requests.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

jest.mock('~/src/server/common/plugins/auth/utils.js')
jest.mock('@hapi/wreck')
jest.mock('~/src/config/config.js')

describe('#authenticated-requests', () => {
  let mockRequest
  let mockHeaders

  const getUserSessionMock = jest.mocked(getUserSession)

  beforeEach(() => {
    jest.clearAllMocks()

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
        error: jest.fn()
      }
    }

    getUserSessionMock.mockImplementation(() => ({
      token: 'test-token'
    }))

    mockHeaders = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token'
    }

    config.get.mockImplementation(() => {
      return { apiUrl: 'http://localhost:3001' }
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
})
