import { vi } from 'vitest'
import { routes } from '#src/server/common/constants/routes.js'
import { employeeSession } from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  confirmEmployeeController,
  confirmEmployeeSubmitController,
  CONFIRM_EMPLOYEE_VIEW_ROUTE
} from '#src/server/defraid-post-login/confirm-employee/controller.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#postLoginConfirmEmployee', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnThis(),
    view: vi.fn().mockReturnThis(),
    continue: vi.fn()
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
  })

  describe('#confirmEmployeeController', () => {
    test('correctly renders page', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await confirmEmployeeController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CONFIRM_EMPLOYEE_VIEW_ROUTE, {
        backLink: `${routes.CHANGE_ORGANISATION}?skipRedirect=true`,
        heading: `Are you notifying us as an employee of ${employeeSession.organisationName}?`,
        organisationName: 'Test Org',
        pageTitle: `Are you notifying us as an employee of ${employeeSession.organisationName}?`,
        hasMultipleOrgPickerEntries: false,
        payload: {
          confirmEmployee: null
        }
      })
    })
  })

  describe('#confirmEmployeeSubmitController', () => {
    test('correctly redirects when user answers that they are an individual', async () => {
      const request = createMockRequest({
        payload: { confirmEmployee: 'personal' }
      })
      const h = createMockH()

      await confirmEmployeeSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        routes.postLogin.GUIDANCE_INDIVIDUAL
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('correctly redirects when user answers that they are part of a different organisation', async () => {
      const request = createMockRequest({
        payload: { confirmEmployee: 'organisation' }
      })
      const h = createMockH()

      await confirmEmployeeSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.postLogin.GUIDANCE_ORG)
      expect(h.view).not.toHaveBeenCalled()
    })

    test('should validate payload correctly', () => {
      const validationSchema =
        confirmEmployeeSubmitController.options.validate.payload

      expect(
        validationSchema.validate({ confirmEmployee: 'yes' }).error
      ).toBeUndefined()
      expect(
        validationSchema.validate({ confirmEmployee: 'personal' }).error
      ).toBeUndefined()
      expect(
        validationSchema.validate({ confirmEmployee: 'organisation' }).error
      ).toBeUndefined()

      expect(validationSchema.validate({}).error).toBeDefined()
    })

    test('should redirect if user confirms they are employee user', async () => {
      const request = createMockRequest({
        payload: { confirmEmployee: 'yes' }
      })
      const h = createMockH()
      await confirmEmployeeSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.PROJECT_NAME)
      expect(h.view).not.toHaveBeenCalled()
    })
  })
})
