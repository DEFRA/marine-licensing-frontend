import { vi } from 'vitest'
import { routes } from '#src/server/common/constants/routes.js'
import { citizenUserSession } from '~/tests/integration/shared/session-fixtures.js'
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
    view: vi.fn().mockReturnThis(),
    continue: vi.fn()
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)
  })

  describe('#confirmIndividualController', () => {
    test('correctly renders page', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await confirmIndividualController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
        heading: `Confirm you're notifying us as ${citizenUserSession.displayName} for a personal project`,
        pageTitle: "Confirm you're notifying us as an individual",
        payload: { confirmIndividual: null }
      })
    })
  })

  describe('#confirmIndividualSubmitController', () => {
    test('correctly redirects to guidance page if user answers no', async () => {
      const request = createMockRequest({
        payload: { confirmIndividual: 'no' }
      })
      const h = createMockH()

      await confirmIndividualSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.postLogin.GUIDANCE_ORG)
      expect(h.view).not.toHaveBeenCalled()
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
