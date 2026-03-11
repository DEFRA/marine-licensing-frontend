import { vi } from 'vitest'
import {
  clearMarineLicenceCache,
  getMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import {
  declarationController,
  declarationSubmitController,
  DECLARATION_VIEW_ROUTE
} from '#src/server/declaration/controller.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/helpers/session-cache/utils.js')
vi.mock('#src/server/common/plugins/auth/utils.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')

describe('#declarationController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockH = { view: vi.fn() }
    mockRequest = { yar: {} }
  })

  describe('GET handler', () => {
    beforeEach(() => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: 'Test User',
        email: 'test@example.com'
      })
    })

    test('renders declaration page for exemption', async () => {
      vi.mocked(getProjectType).mockReturnValue(PROJECT_TYPE.EXEMPTION)

      await declarationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(DECLARATION_VIEW_ROUTE, {
        pageTitle: 'Declaration',
        backLink: routes.CHECK_YOUR_ANSWERS
      })
    })

    test('renders declaration page for marine licence', async () => {
      vi.mocked(getProjectType).mockReturnValue(PROJECT_TYPE.MARINE_LICENCE)

      await declarationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(DECLARATION_VIEW_ROUTE, {
        pageTitle: 'Declaration',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      })
    })

    test('redirects to dashboard when user session has no displayName', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValueOnce({})
      mockH.redirect = vi.fn()

      await declarationController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      expect(mockH.view).not.toHaveBeenCalled()
    })
  })
})

describe('#declarationSubmitController', () => {
  let mockRequest
  let mockH

  const mockUserSession = {
    displayName: 'Test User',
    email: 'john.doe@example.com'
  }

  beforeEach(() => {
    mockH = { view: vi.fn() }
    mockRequest = {
      state: { userSession: {} },
      logger: { error: vi.fn() },
      yar: {}
    }
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue(mockUserSession)
  })

  describe('#declarationSubmitController/exemptions', () => {
    test('stays on the same page for exemption', async () => {
      vi.mocked(getProjectType).mockReturnValue(PROJECT_TYPE.EXEMPTION)

      await declarationSubmitController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(DECLARATION_VIEW_ROUTE, {
        pageTitle: 'Declaration',
        backLink: routes.CHECK_YOUR_ANSWERS
      })
    })
  })

  describe('#declarationSubmitController/marine-licence', () => {
    beforeEach(() => {
      vi.mocked(getProjectType).mockReturnValue(PROJECT_TYPE.MARINE_LICENCE)
      vi.mocked(getMarineLicenceCache).mockReturnValue(
        mockMarineLicenceApplication
      )
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'success',
          value: { applicationReference: 'ML-REF-001' }
        }
      })
    })

    test('throws error when marine licence has no id', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({})

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow('Marine licence not found')
    })

    test('correctly submits marine-licence with correct arguments', async () => {
      mockH.redirect = vi.fn()

      await declarationSubmitController.handler(mockRequest, mockH)

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        mockRequest,
        '/marine-licence/submit',
        { id: mockMarineLicenceApplication.id }
      )

      expect(clearMarineLicenceCache).toHaveBeenCalledWith(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=ML-REF-001`
      )
    })

    test('throws when API returns unexpected response', async () => {
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'error' }
      })

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow(errorMessages.MARINE_LICENCE_SUBMISSION_FAILED)
    })

    test('throws when API returns success but no value', async () => {
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'success', value: null }
      })

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow(errorMessages.MARINE_LICENCE_SUBMISSION_FAILED)
    })
  })
})
