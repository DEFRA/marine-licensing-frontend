import { jest } from '@jest/globals'

import {
  authenticatedRequest,
  authenticatedGetRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import {
  getExemptionCache,
  setExemptionCache,
  clearExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'

import {
  deleteExemptionController,
  deleteExemptionSelectController,
  deleteExemptionSubmitController
} from './controller.js'

jest.mock('~/src/server/common/helpers/authenticated-requests.js')
jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#delete', () => {
  let mockRequest
  let mockH

  const mockedAuthenticatedGetRequest = jest.mocked(authenticatedGetRequest)
  const mockedAuthenticatedRequest = jest.mocked(authenticatedRequest)

  const mockedGetExemptionCache = jest.mocked(getExemptionCache)
  const mockedSetExemptionCache = jest.mocked(setExemptionCache)
  const mockedClearExemptionCache = jest.mocked(clearExemptionCache)

  beforeEach(() => {
    mockRequest = {
      logger: {
        error: jest.fn(),
        info: jest.fn()
      }
    }

    mockH = {
      view: jest.fn().mockReturnValue('view-response'),
      redirect: jest.fn().mockReturnValue('redirect-response')
    }

    jest.clearAllMocks()
  })

  describe('deleteExemptionController', () => {
    it('should render the delete confirmation page with project details', async () => {
      const mockExemption = { id: 'test-project-id' }
      const mockProject = {
        projectName: 'Test Project',
        id: 'test-project-id'
      }

      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: mockProject }
      })

      const result = await deleteExemptionController.handler(mockRequest, mockH)

      expect(mockedGetExemptionCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedAuthenticatedGetRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/test-project-id'
      )
      expect(mockH.view).toHaveBeenCalledWith('exemption/delete/index', {
        pageTitle: 'Are you sure you want to delete this project?',
        heading: 'Are you sure you want to delete this project?',
        projectName: 'Test Project',
        exemptionId: 'test-project-id',
        backLink: '/home',
        routes
      })
      expect(result).toBe('view-response')
    })

    it('should throw 404 if exemption is not found in cache', async () => {
      mockedGetExemptionCache.mockReturnValue({ id: undefined })

      await expect(
        deleteExemptionController.handler(mockRequest, mockH)
      ).rejects.toThrow('Exemption not found')
    })

    it('should redirect to dashboard if project is not found', async () => {
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: null }
      })

      const result = await deleteExemptionController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if API call fails', async () => {
      const mockExemption = { id: 'test-project-id' }
      const mockError = new Error('API Error')
      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockedAuthenticatedGetRequest.mockRejectedValue(mockError)

      const result = await deleteExemptionController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if project payload is undefined', async () => {
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: undefined }
      })

      const result = await deleteExemptionController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })

  describe('deleteExemptionSelectController', () => {
    it('should clear cache, set exemption ID in cache, and redirect to delete page', () => {
      mockRequest.params = { exemptionId: 'test-project-id' }

      const result = deleteExemptionSelectController.handler(mockRequest, mockH)

      expect(mockedClearExemptionCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedSetExemptionCache).toHaveBeenCalledWith(mockRequest, {
        id: 'test-project-id'
      })
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DELETE_EXEMPTION)
      expect(result).toBe('redirect-response')
    })
  })

  describe('deleteExemptionSubmitController', () => {
    it('should delete exemption and redirect to dashboard when IDs match', async () => {
      mockRequest.payload = { exemptionId: 'test-project-id' }
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)

      const result = await deleteExemptionSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockedGetExemptionCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedAuthenticatedRequest).toHaveBeenCalledWith(
        mockRequest,
        'DELETE',
        '/exemption/test-project-id'
      )
      expect(mockedClearExemptionCache).toHaveBeenCalledWith(mockRequest)
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when exemption ID is missing', async () => {
      mockRequest.payload = {}
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)

      const result = await deleteExemptionSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when exemption IDs do not match', async () => {
      mockRequest.payload = { exemptionId: 'different-id' }
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)

      const result = await deleteExemptionSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when exception occurs', async () => {
      mockRequest.payload = { exemptionId: 'test-project-id' }
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockedAuthenticatedRequest.mockRejectedValue(new Error('Test error'))

      const result = await deleteExemptionSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })
})
