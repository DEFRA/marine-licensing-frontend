import { vi } from 'vitest'
import { routes } from '#src/server/common/constants/routes.js'
import { agentSession } from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  confirmAgentController,
  confirmAgentSubmitController,
  CONFIRM_AGENT_VIEW_ROUTE
} from '#src/server/defraid-post-login/confirm-agent/controller.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#postLoginConfirmAgent', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnThis(),
    view: vi.fn().mockReturnThis(),
    continue: vi.fn()
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
  })

  describe('#confirmAgentController', () => {
    test('correctly renders page', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await confirmAgentController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CONFIRM_AGENT_VIEW_ROUTE, {
        heading: `Are you notifying us as an agent or intermediary for ${agentSession.organisationName}?`,
        organisationName: 'Client Org',
        pageTitle: `Are you notifying us as an agent or intermediary for ${agentSession.organisationName}?`,
        hasMultipleOrgPickerEntries: false,
        payload: {
          confirmAgent: null
        }
      })
    })
  })

  describe('#confirmAgentSubmitController', () => {
    test('correctly renders page', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await confirmAgentSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CONFIRM_AGENT_VIEW_ROUTE, {
        heading: `Are you notifying us as an agent or intermediary for ${agentSession.organisationName}?`,
        organisationName: 'Client Org',
        pageTitle: `Are you notifying us as an agent or intermediary for ${agentSession.organisationName}?`,
        payload: {},
        hasMultipleOrgPickerEntries: false
      })
    })

    test('should validate payload correctly', () => {
      const validationSchema =
        confirmAgentSubmitController.options.validate.payload

      expect(
        validationSchema.validate({ confirmAgent: 'yes' }).error
      ).toBeUndefined()
      expect(
        validationSchema.validate({ confirmAgent: 'personal' }).error
      ).toBeUndefined()
      expect(
        validationSchema.validate({ confirmAgent: 'organisation' }).error
      ).toBeUndefined()

      expect(validationSchema.validate({}).error).toBeDefined()
    })

    test('should redirect if user confirms they are agent user', async () => {
      const request = createMockRequest({
        payload: { confirmAgent: 'yes' }
      })
      const h = createMockH()
      await confirmAgentSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.PROJECT_NAME)
      expect(h.view).not.toHaveBeenCalled()
    })
  })
})
