import { vi } from 'vitest'
import { routes } from '#src/server/common/constants/routes.js'
import {
  citizenUserSession,
  employeeSession
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  confirmIndividualController,
  confirmIndividualSubmitController,
  CONFIRM_INDIVIDUAL_VIEW_ROUTE
} from '#src/server/defraid-post-login/confirm-individual/controller.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#postLoginConfirmIndividual', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnThis(),
    view: vi.fn().mockReturnThis()
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)
  })

  describe('#confirmIndividualController', () => {
    test('redirects to signin when no session details exist', async () => {
      vi.mocked(getUserSession).mockResolvedValue({})

      const request = createMockRequest()
      const h = createMockH()

      await confirmIndividualController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.SIGNIN)
      expect(h.view).not.toHaveBeenCalled()
    })

    test('redirects to exemption landing page when incorrect user type is selected', async () => {
      vi.mocked(getUserSession).mockResolvedValue(employeeSession)

      const request = createMockRequest()
      const h = createMockH()

      await confirmIndividualController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.EXEMPTION)
      expect(h.view).not.toHaveBeenCalled()
    })

    test('correctly renders page', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await confirmIndividualSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
        displayName: `${citizenUserSession.displayName}`,
        heading: `Confirm you're notifying us as ${citizenUserSession.displayName} for a personal project`,
        pageTitle: "Confirm you're notifying us as an individual"
      })
    })
  })

  describe('#confirmIndividualSubmitController', () => {
    test('correctly renders page', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await confirmIndividualController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
        displayName: `${citizenUserSession.displayName}`,
        heading: `Confirm you're notifying us as ${citizenUserSession.displayName} for a personal project`,
        pageTitle: "Confirm you're notifying us as an individual"
      })
    })
  })
})
