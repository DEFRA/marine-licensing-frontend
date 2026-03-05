import { vi } from 'vitest'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  getExemptionCache,
  clearExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
import {
  routes,
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import {
  declarationController,
  declarationSubmitController,
  DECLARATION_VIEW_ROUTE
} from '#src/server/declaration/controller.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { mockExemption } from '~/src/server/test-helpers/mocks/exemption.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/common/helpers/session-cache/utils.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

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
    const mockApplicationReference = 'EXE/2025/10264'

    beforeEach(() => {
      vi.mocked(getProjectType).mockReturnValue(PROJECT_TYPE.EXEMPTION)
      vi.mocked(getExemptionCache).mockReturnValue(mockExemption)
      mockH.redirect = vi.fn()
    })

    test('submits exemption and redirects to confirmation', async () => {
      vi.mocked(authenticatedPostRequest).mockResolvedValue({
        payload: {
          message: 'success',
          value: { applicationReference: mockApplicationReference }
        }
      })

      await declarationSubmitController.handler(mockRequest, mockH)

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        mockRequest,
        apiRoutes.SUBMIT_EXEMPTION,
        {
          id: mockExemption.id,
          userName: mockUserSession.displayName,
          userEmail: mockUserSession.email
        }
      )
      expect(clearExemptionCache).toHaveBeenCalledWith(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${routes.CONFIRMATION}?applicationReference=${encodeURIComponent(mockApplicationReference)}`
      )
    })

    test('throws not found when exemption has no id', async () => {
      vi.mocked(getExemptionCache).mockReturnValue({})

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow('Exemption not found')
    })

    test('throws error when user session is missing', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValueOnce({})

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow(errorMessages.SUBMISSION_FAILED)
    })

    test('throws error on unexpected API response', async () => {
      vi.mocked(authenticatedPostRequest).mockResolvedValue({
        payload: { message: 'unexpected' }
      })

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow(errorMessages.SUBMISSION_FAILED)
    })

    test('throws error when API call fails', async () => {
      vi.mocked(authenticatedPostRequest).mockRejectedValue(
        new Error('API error')
      )

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow(errorMessages.SUBMISSION_FAILED)
    })
  })

  describe('#declarationSubmitController/marine-licence', () => {
    beforeEach(() => {
      vi.mocked(getProjectType).mockReturnValue(PROJECT_TYPE.MARINE_LICENCE)
    })

    test('throws error when marine licence has no id', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({})

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow('Marine licence not found')
    })

    test('stays on the same page for marine-license', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue(
        mockMarineLicenceApplication
      )

      await declarationSubmitController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(DECLARATION_VIEW_ROUTE, {
        pageTitle: 'Declaration',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      })
    })

    test('correct session error handling for marine-license', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValueOnce({})
      vi.mocked(getMarineLicenceCache).mockReturnValue(
        mockMarineLicenceApplication
      )

      await expect(
        declarationSubmitController.handler(mockRequest, mockH)
      ).rejects.toThrow(errorMessages.SUBMISSION_FAILED)
    })
  })
})
