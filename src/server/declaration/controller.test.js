import { vi } from 'vitest'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
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

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
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
  })
})

describe('#declarationSubmitController', () => {
  let mockRequest
  let mockH

  const mockUserSession = {
    displayName: 'Test User',
    email: ''
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
    test('stays on the same page for marine-license', async () => {
      vi.mocked(getProjectType).mockReturnValue(PROJECT_TYPE.MARINE_LICENCE)
      vi.mocked(getMarineLicenceCache).mockReturnValue({ id: 'ml-123' })

      await declarationSubmitController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(DECLARATION_VIEW_ROUTE, {
        pageTitle: 'Declaration',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      })
    })
  })
})
