import { vi } from 'vitest'

import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  getExemptionCache,
  setExemptionCache,
  clearExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'

import {
  withdrawExemptionController,
  withdrawExemptionSelectController,
  withdrawExemptionSubmitController
} from './controller.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/services/exemption-service/index.js')

describe('#withdraw', () => {
  let mockRequest
  let mockH
  let mockExemptionService

  const mockedGetExemptionService = vi.mocked(getExemptionService)
  const mockedAuthenticatedPostRequest = vi.mocked(authenticatedPostRequest)

  const mockedGetExemptionCache = vi.mocked(getExemptionCache)
  const mockedSetExemptionCache = vi.mocked(setExemptionCache)
  const mockedClearExemptionCache = vi.mocked(clearExemptionCache)

  beforeEach(() => {
    mockExemptionService = {
      getExemptionById: vi.fn()
    }

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

    mockedGetExemptionService.mockReturnValue(mockExemptionService)
  })

  describe('withdrawExemptionController', () => {
    it('should render the withdraw confirmation page with project details', async () => {
      const mockExemption = { id: 'test-project-id' }
      const mockSavedExemption = {
        projectName: 'Test Project',
        id: 'test-project-id'
      }

      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockExemptionService.getExemptionById.mockResolvedValue(
        mockSavedExemption
      )

      const result = await withdrawExemptionController.handler(
        mockRequest,
        mockH
      )

      expect(mockedGetExemptionCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedGetExemptionService).toHaveBeenCalledWith(mockRequest)
      expect(mockExemptionService.getExemptionById).toHaveBeenCalledWith(
        'test-project-id'
      )
      expect(mockH.view).toHaveBeenCalledWith('exemption/withdraw/index', {
        pageTitle: 'Are you sure you want to withdraw this project?',
        heading: 'Are you sure you want to withdraw this project?',
        projectName: 'Test Project',
        exemptionType: EXEMPTION_TYPE,
        exemptionId: 'test-project-id',
        backLink: '/projects',
        routes
      })
      expect(result).toBe('view-response')
    })

    it('should throw 404 if exemption is not found in cache', async () => {
      mockedGetExemptionCache.mockReturnValue({ id: undefined })

      await expect(
        withdrawExemptionController.handler(mockRequest, mockH)
      ).rejects.toThrow('Exemption not found')
    })

    it('should redirect to dashboard if project is not found', async () => {
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockExemptionService.getExemptionById.mockResolvedValue(null)

      const result = await withdrawExemptionController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if service call fails', async () => {
      const mockExemption = { id: 'test-project-id' }
      const mockError = new Error('Service Error')
      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockExemptionService.getExemptionById.mockRejectedValue(mockError)

      const result = await withdrawExemptionController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if saved exemption is undefined', async () => {
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockExemptionService.getExemptionById.mockResolvedValue(undefined)

      const result = await withdrawExemptionController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })

  describe('withdrawExemptionSelectController', () => {
    it('should clear cache, set exemption ID in cache, and redirect to withdraw page', async () => {
      mockRequest.params = { exemptionId: 'test-project-id' }

      const result = await withdrawExemptionSelectController.handler(
        mockRequest,
        mockH
      )

      expect(mockedClearExemptionCache).toHaveBeenCalledWith(mockRequest, mockH)
      expect(mockedSetExemptionCache).toHaveBeenCalledWith(mockRequest, mockH, {
        id: 'test-project-id'
      })
      expect(mockH.redirect).toHaveBeenCalledWith(routes.WITHDRAW_EXEMPTION)
      expect(result).toBe('redirect-response')
    })
  })

  describe('withdrawExemptionSubmitController', () => {
    it('should withdraw exemption and redirect to dashboard when IDs match', async () => {
      mockRequest.payload = { exemptionId: 'test-project-id' }
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)

      const result = await withdrawExemptionSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockedGetExemptionCache).toHaveBeenCalledWith(mockRequest)
      expect(mockedAuthenticatedPostRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/test-project-id/withdraw',
        {}
      )
      expect(mockedClearExemptionCache).toHaveBeenCalledWith(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when exemption ID is missing', async () => {
      mockRequest.payload = {}
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)

      const result = await withdrawExemptionSubmitController.handler(
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

      const result = await withdrawExemptionSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when error occurs', async () => {
      mockRequest.payload = { exemptionId: 'test-project-id' }
      const mockExemption = { id: 'test-project-id' }
      mockedGetExemptionCache.mockReturnValue(mockExemption)
      mockedAuthenticatedPostRequest.mockRejectedValue(new Error('Test error'))

      const result = await withdrawExemptionSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })
})
