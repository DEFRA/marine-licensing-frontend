import { vi } from 'vitest'

import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  getMarineLicenceCache,
  clearMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { MARINE_LICENCE_TYPE } from '#src/server/common/constants/marine-licence.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import * as marineLicenceServiceModule from '#src/services/marine-licence-service/index.js'

import {
  withdrawMarineLicenceConfirmController,
  withdrawMarineLicenceSubmitController,
  TERMS_AND_CONDITIONS_LINK
} from './controller.js'

vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#withdrawMarineLicence', () => {
  let mockRequest
  let mockH
  let mockGetMarineLicenceById

  const mockedAuthenticatedPostRequest = vi.mocked(authenticatedPostRequest)
  const mockedGetMarineLicenceCache = vi.mocked(getMarineLicenceCache)
  const mockedClearMarineLicenceCache = vi.mocked(clearMarineLicenceCache)

  const marineLicenceId = 'test-project-id'

  const submittedMarineLicence = {
    id: marineLicenceId,
    projectName: 'Worthing pier repairs',
    status: PROJECT_STATUS.SUBMITTED
  }

  beforeEach(() => {
    mockRequest = {
      logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
      state: {}
    }

    mockH = {
      view: vi.fn().mockReturnValue('view-response'),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }

    mockGetMarineLicenceById = vi.fn()
    vi.spyOn(
      marineLicenceServiceModule,
      'getMarineLicenceService'
    ).mockReturnValue({ getMarineLicenceById: mockGetMarineLicenceById })
  })

  describe('withdrawMarineLicenceConfirmController', () => {
    it('should render the withdraw confirmation page with project details', async () => {
      mockedGetMarineLicenceCache.mockReturnValue({ id: marineLicenceId })
      mockGetMarineLicenceById.mockResolvedValue(submittedMarineLicence)

      const result = await withdrawMarineLicenceConfirmController.handler(
        mockRequest,
        mockH
      )

      expect(mockGetMarineLicenceById).toHaveBeenCalledWith(marineLicenceId)
      expect(mockH.view).toHaveBeenCalledWith('marine-licence/withdraw/index', {
        pageTitle: 'Are you sure you want to withdraw this application?',
        heading: 'Are you sure you want to withdraw this application?',
        projectName: 'Worthing pier repairs',
        marineLicenceType: MARINE_LICENCE_TYPE,
        marineLicenceId,
        termsAndConditionsLink: TERMS_AND_CONDITIONS_LINK,
        backLink: routes.DASHBOARD,
        cancelLink: routes.DASHBOARD
      })
      expect(result).toBe('view-response')
    })

    it('should redirect to dashboard if no marine licence is selected in the cache', async () => {
      mockedGetMarineLicenceCache.mockReturnValue({ id: undefined })

      const result = await withdrawMarineLicenceConfirmController.handler(
        mockRequest,
        mockH
      )

      expect(mockGetMarineLicenceById).not.toHaveBeenCalled()
      expect(mockH.view).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it.each([
      PROJECT_STATUS.DRAFT,
      PROJECT_STATUS.TRANSFERRED,
      PROJECT_STATUS.WITHDRAWN
    ])('should redirect to dashboard when status is %s', async (status) => {
      mockedGetMarineLicenceCache.mockReturnValue({ id: marineLicenceId })
      mockGetMarineLicenceById.mockResolvedValue({
        ...submittedMarineLicence,
        status
      })

      const result = await withdrawMarineLicenceConfirmController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if the project is not found', async () => {
      mockedGetMarineLicenceCache.mockReturnValue({ id: marineLicenceId })
      mockGetMarineLicenceById.mockResolvedValue(null)

      const result = await withdrawMarineLicenceConfirmController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard if the API call fails', async () => {
      mockedGetMarineLicenceCache.mockReturnValue({ id: marineLicenceId })
      mockGetMarineLicenceById.mockRejectedValue(new Error('API Error'))

      const result = await withdrawMarineLicenceConfirmController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.logger.error).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })

  describe('withdrawMarineLicenceSubmitController', () => {
    it('should withdraw the marine licence and redirect to dashboard when IDs match', async () => {
      mockRequest.payload = { marineLicenceId }
      mockedGetMarineLicenceCache.mockReturnValue({ id: marineLicenceId })

      const result = await withdrawMarineLicenceSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockedAuthenticatedPostRequest).toHaveBeenCalledWith(
        mockRequest,
        `/marine-licence/${marineLicenceId}/withdraw`,
        {}
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
      mockedGetMarineLicenceCache.mockReturnValue({ id: marineLicenceId })

      const result = await withdrawMarineLicenceSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockedAuthenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when marine licence IDs do not match', async () => {
      mockRequest.payload = { marineLicenceId: 'different-id' }
      mockedGetMarineLicenceCache.mockReturnValue({ id: marineLicenceId })

      const result = await withdrawMarineLicenceSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockedAuthenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })

    it('should redirect to dashboard when an exception occurs', async () => {
      mockRequest.payload = { marineLicenceId }
      mockedGetMarineLicenceCache.mockReturnValue({ id: marineLicenceId })
      mockedAuthenticatedPostRequest.mockRejectedValue(new Error('Test error'))

      const result = await withdrawMarineLicenceSubmitController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.logger.error).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(result).toBe('redirect-response')
    })
  })
})
