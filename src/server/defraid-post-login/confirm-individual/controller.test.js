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
        heading: `Confirm you're notifying us as ${citizenUserSession.displayName} for a personal project`,
        pageTitle: "Confirm you're notifying us as an individual",
        payload: {}
      })
    })
  })

  describe('#confirmIndividualSubmitController', () => {
    test('correctly renders page', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await confirmIndividualSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
        heading: `Confirm you're notifying us as ${citizenUserSession.displayName} for a personal project`,
        pageTitle: "Confirm you're notifying us as an individual",
        payload: {}
      })
    })

    test('should validate payload correctly', () => {
      const validationSchema =
        confirmIndividualSubmitController.options.validate.payload

      expect(
        validationSchema.validate({ confirmIndividual: 'yes' }).error
      ).toBeUndefined()
      expect(
        validationSchema.validate({ confirmIndividual: 'no' }).error
      ).toBeUndefined()

      expect(validationSchema.validate({}).error).toBeDefined()
    })

    test('redirects to signin when no session details exist after submit', async () => {
      vi.mocked(getUserSession).mockResolvedValue({})

      const request = createMockRequest()
      const h = createMockH()

      await confirmIndividualSubmitController.options.validate.failAction(
        request,
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.SIGNIN)
      expect(h.view).not.toHaveBeenCalled()
    })

    test('should redirect if user confirms they are individual user', async () => {
      const request = createMockRequest({
        payload: { confirmIndividual: 'yes' }
      })
      const h = createMockH()
      await confirmIndividualSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.PROJECT_NAME)
      expect(h.view).not.toHaveBeenCalled()
    })
  })
})
