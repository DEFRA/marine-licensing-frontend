import { vi } from 'vitest'

import {
  authenticatedRequest,
  authenticatedGetRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import {
  getExemptionCache,
  setExemptionCache,
  clearExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

import {
  deleteExemptionController,
  deleteExemptionSelectController,
  deleteExemptionSubmitController
} from './controller.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#delete', () => {
  let mockRequest
  let mockH

  const mockedAuthenticatedGetRequest = vi.mocked(authenticatedGetRequest)
  const mockedAuthenticatedRequest = vi.mocked(authenticatedRequest)

  const mockedGetExemptionCache = vi.mocked(getExemptionCache)
  const mockedSetExemptionCache = vi.mocked(setExemptionCache)
  const mockedClearExemptionCache = vi.mocked(clearExemptionCache)

  beforeEach(() => {
    mockRequest = {
      logger: {
        error: vi.fn(),
        info: vi.fn()
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('view-response'),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
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
        backLink: '/projects',
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
    it('should clear cache, set exemption ID in cache, and redirect to delete page', async () => {
      mockRequest.params = { exemptionId: 'test-project-id' }

      const result = await deleteExemptionSelectController.handler(
        mockRequest,
        mockH
      )

      expect(mockedClearExemptionCache).toHaveBeenCalledWith(mockRequest, mockH)
      expect(mockedSetExemptionCache).toHaveBeenCalledWith(mockRequest, mockH, {
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
      expect(mockedClearExemptionCache).toHaveBeenCalledWith(mockRequest, mockH)
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
