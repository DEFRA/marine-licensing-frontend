import { vi } from 'vitest'

import {
  authenticatedRequest,
  authenticatedGetRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import {
  getMarineLicenseCache,
  setMarineLicenseCache,
  clearMarineLicenseCache
} from '#src/server/common/helpers/marine-license/session-cache/utils.js'
import {
  routes,
  marineLicenseRoutes
} from '#src/server/common/constants/routes.js'
import { MARINE_LICENCE_TYPE } from '#src/server/common/constants/marine-licence.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'

import {
  deleteMarineLicenseController,
  deleteMarineLicenseSelectController,
  deleteMarineLicenseSubmitController
} from './controller.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/marine-license/session-cache/utils.js')

describe('#delete', () => {
  let mockRequest
  let mockH

  const mockedAuthenticatedGetRequest = vi.mocked(authenticatedGetRequest)
  const mockedAuthenticatedRequest = vi.mocked(authenticatedRequest)

  const mockedGetMarineLicenseCache = vi.mocked(getMarineLicenseCache)
  const mockedSetMarineLicenseCache = vi.mocked(setMarineLicenseCache)
  const mockedClearMarineLicenseCache = vi.mocked(clearMarineLicenseCache)

  const mockUserSession = {
    contactId: 'id-123'
  }

  beforeEach(() => {
    mockRequest = {
      logger: {
        error: vi.fn(),
        info: vi.fn()
      },
      state: {}
    }

    mockH = {
      view: vi.fn().mockReturnValue('view-response'),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }

    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({ mockUserSession })
  })

  describe('deleteMarineLicenseController', () => {
    it('should render the delete confirmation page with project details', async () => {
      const mockMarineLicense = { id: 'test-project-id' }
      const mockProject = {
        projectName: 'Test Project',
        id: 'test-project-id'
      }

      mockedGetMarineLicenseCache.mockReturnValue(mockMarineLicense)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: mockProject }
      })

      const result = await deleteMarineLicenseController.handler(
        mockRequest,
        mockH
      )

      expect(mockedGetMarineLicenseCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedAuthenticatedGetRequest).toHaveBeenCalledWith(
        mockRequest,
        '/marine-license/test-project-id'
      )
      expect(mockH.view).toHaveBeenCalledWith('marine-license/delete/index', {
        pageTitle: 'Are you sure you want to delete this project?',
        heading: 'Are you sure you want to delete this project?',
        projectName: 'Test Project',
        marineLicenseType: MARINE_LICENCE_TYPE,
        marineLicenseId: 'test-project-id',
        cancelLink: '/projects',
        backLink: '/projects',
        routes
      })
      expect(result).toBe('view-response')
    })

    it('should throw 404 if marine license is not found in cache', async () => {
      mockedGetMarineLicenseCache.mockReturnValue({ id: undefined })

      await expect(
        deleteMarineLicenseController.handler(mockRequest, mockH)
      ).rejects.toThrow('Marine license not found')
    })

    it('should redirect to dashboard if project is not found', async () => {
      const mockMarineLicense = { id: 'test-project-id' }
      mockedGetMarineLicenseCache.mockReturnValue(mockMarineLicense)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: null }
      })

      const result = await deleteMarineLicenseController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if API call fails', async () => {
      const mockMarineLicense = { id: 'test-project-id' }
      const mockError = new Error('API Error')
      mockedGetMarineLicenseCache.mockReturnValue(mockMarineLicense)
      mockedAuthenticatedGetRequest.mockRejectedValue(mockError)

      const result = await deleteMarineLicenseController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if project payload is undefined', async () => {
      const mockMarineLicense = { id: 'test-project-id' }
      mockedGetMarineLicenseCache.mockReturnValue(mockMarineLicense)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: undefined }
      })

      const result = await deleteMarineLicenseController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })

  describe('deleteMarineLicenseSelectController', () => {
    it('should clear cache, set marine license ID in cache, and redirect to delete page', async () => {
      mockRequest.params = { marineLicenseId: 'test-project-id' }

      const result = await deleteMarineLicenseSelectController.handler(
        mockRequest,
        mockH
      )

      expect(mockedClearMarineLicenseCache).toHaveBeenCalledWith(
        mockRequest,
        mockH
      )
      expect(mockedSetMarineLicenseCache).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        { id: 'test-project-id' }
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        marineLicenseRoutes.MARINE_LICENSE_DELETE
      )
      expect(result).toBe('redirect-response')
    })
  })

  describe('deleteMarineLicenseSubmitController', () => {
    it('should delete marine license and redirect to dashboard when IDs match', async () => {
      mockRequest.payload = { marineLicenseId: 'test-project-id' }
      const mockMarineLicense = { id: 'test-project-id' }
      mockedGetMarineLicenseCache.mockReturnValue(mockMarineLicense)

      const result = await deleteMarineLicenseSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockedGetMarineLicenseCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedAuthenticatedRequest).toHaveBeenCalledWith(
        mockRequest,
        'DELETE',
        '/marine-license/test-project-id'
      )
      expect(mockedClearMarineLicenseCache).toHaveBeenCalledWith(
        mockRequest,
        mockH
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when marine license ID is missing', async () => {
      mockRequest.payload = {}
      const mockMarineLicense = { id: 'test-project-id' }
      mockedGetMarineLicenseCache.mockReturnValue(mockMarineLicense)

      const result = await deleteMarineLicenseSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when marine license IDs do not match', async () => {
      mockRequest.payload = { marineLicenseId: 'different-id' }
      const mockMarineLicense = { id: 'test-project-id' }
      mockedGetMarineLicenseCache.mockReturnValue(mockMarineLicense)

      const result = await deleteMarineLicenseSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when exception occurs', async () => {
      mockRequest.payload = { marineLicenseId: 'test-project-id' }
      const mockMarineLicense = { id: 'test-project-id' }
      mockedGetMarineLicenseCache.mockReturnValue(mockMarineLicense)
      mockedAuthenticatedRequest.mockRejectedValue(new Error('Test error'))

      const result = await deleteMarineLicenseSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })
})
