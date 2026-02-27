import { vi } from 'vitest'

import {
  authenticatedRequest,
  authenticatedGetRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import {
  getMarineLicenceCache,
  setMarineLicenceCache,
  clearMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { MARINE_LICENCE_TYPE } from '#src/server/common/constants/marine-licence.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'

import {
  deleteMarineLicenceController,
  deleteMarineLicenceSelectController,
  deleteMarineLicenceSubmitController
} from './controller.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#delete', () => {
  let mockRequest
  let mockH

  const mockedAuthenticatedGetRequest = vi.mocked(authenticatedGetRequest)
  const mockedAuthenticatedRequest = vi.mocked(authenticatedRequest)

  const mockedGetMarineLicenceCache = vi.mocked(getMarineLicenceCache)
  const mockedSetMarineLicenceCache = vi.mocked(setMarineLicenceCache)
  const mockedClearMarineLicenceCache = vi.mocked(clearMarineLicenceCache)

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

  describe('deleteMarineLicenceController', () => {
    it('should render the delete confirmation page with project details', async () => {
      const mockMarineLicence = { id: 'test-project-id' }
      const mockProject = {
        projectName: 'Test Project',
        id: 'test-project-id'
      }

      mockedGetMarineLicenceCache.mockReturnValue(mockMarineLicence)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: mockProject }
      })

      const result = await deleteMarineLicenceController.handler(
        mockRequest,
        mockH
      )

      expect(mockedGetMarineLicenceCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedAuthenticatedGetRequest).toHaveBeenCalledWith(
        mockRequest,
        '/marine-licence/test-project-id'
      )
      expect(mockH.view).toHaveBeenCalledWith('marine-licence/delete/index', {
        pageTitle: 'Are you sure you want to delete this project?',
        heading: 'Are you sure you want to delete this project?',
        projectName: 'Test Project',
        marineLicenceType: MARINE_LICENCE_TYPE,
        marineLicenceId: 'test-project-id',
        cancelLink: '/projects',
        backLink: '/projects',
        routes
      })
      expect(result).toBe('view-response')
    })

    it('should throw 404 if marine licence is not found in cache', async () => {
      mockedGetMarineLicenceCache.mockReturnValue({ id: undefined })

      await expect(
        deleteMarineLicenceController.handler(mockRequest, mockH)
      ).rejects.toThrow('Marine licence not found')
    })

    it('should redirect to dashboard if project is not found', async () => {
      const mockMarineLicence = { id: 'test-project-id' }
      mockedGetMarineLicenceCache.mockReturnValue(mockMarineLicence)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: null }
      })

      const result = await deleteMarineLicenceController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if API call fails', async () => {
      const mockMarineLicence = { id: 'test-project-id' }
      const mockError = new Error('API Error')
      mockedGetMarineLicenceCache.mockReturnValue(mockMarineLicence)
      mockedAuthenticatedGetRequest.mockRejectedValue(mockError)

      const result = await deleteMarineLicenceController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if project payload is undefined', async () => {
      const mockMarineLicence = { id: 'test-project-id' }
      mockedGetMarineLicenceCache.mockReturnValue(mockMarineLicence)
      mockedAuthenticatedGetRequest.mockResolvedValue({
        payload: { value: undefined }
      })

      const result = await deleteMarineLicenceController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })

  describe('deleteMarineLicenceSelectController', () => {
    it('should clear cache, set marine licence ID in cache, and redirect to delete page', async () => {
      mockRequest.params = { marineLicenceId: 'test-project-id' }

      const result = await deleteMarineLicenceSelectController.handler(
        mockRequest,
        mockH
      )

      expect(mockedClearMarineLicenceCache).toHaveBeenCalledWith(
        mockRequest,
        mockH
      )
      expect(mockedSetMarineLicenceCache).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        { id: 'test-project-id' }
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_DELETE
      )
      expect(result).toBe('redirect-response')
    })
  })

  describe('deleteMarineLicenceSubmitController', () => {
    it('should delete marine licence and redirect to dashboard when IDs match', async () => {
      mockRequest.payload = { marineLicenceId: 'test-project-id' }
      const mockMarineLicence = { id: 'test-project-id' }
      mockedGetMarineLicenceCache.mockReturnValue(mockMarineLicence)

      const result = await deleteMarineLicenceSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockedGetMarineLicenceCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedAuthenticatedRequest).toHaveBeenCalledWith(
        mockRequest,
        'DELETE',
        '/marine-licence/test-project-id'
      )
      expect(mockedClearMarineLicenceCache).toHaveBeenCalledWith(
        mockRequest,
        mockH
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when marine licence ID is missing', async () => {
      mockRequest.payload = {}
      const mockMarineLicence = { id: 'test-project-id' }
      mockedGetMarineLicenceCache.mockReturnValue(mockMarineLicence)

      const result = await deleteMarineLicenceSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when marine licence IDs do not match', async () => {
      mockRequest.payload = { marineLicenceId: 'different-id' }
      const mockMarineLicence = { id: 'test-project-id' }
      mockedGetMarineLicenceCache.mockReturnValue(mockMarineLicence)

      const result = await deleteMarineLicenceSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when exception occurs', async () => {
      mockRequest.payload = { marineLicenceId: 'test-project-id' }
      const mockMarineLicence = { id: 'test-project-id' }
      mockedGetMarineLicenceCache.mockReturnValue(mockMarineLicence)
      mockedAuthenticatedRequest.mockRejectedValue(new Error('Test error'))

      const result = await deleteMarineLicenceSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })
})
