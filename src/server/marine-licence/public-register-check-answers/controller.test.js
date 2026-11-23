import { vi } from 'vitest'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  publicRegisterCheckAnswersController,
  publicRegisterCheckAnswersSubmitController,
  PUBLIC_REGISTER_CHECK_ANSWERS_VIEW_ROUTE
} from '#src/server/marine-licence/public-register-check-answers/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#publicRegisterCheckAnswers', () => {
  const nationalSecurity = {
    withholdConsent: 'yes',
    withholdReason: 'nationalSecurity'
  }
  const complete = { ...nationalSecurity, nationalSecurityApproval: 'no' }

  const createH = () => ({ redirect: vi.fn(), view: vi.fn() })

  const mockCache = (publicRegister) =>
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
      id: 'test-id',
      projectName: 'Test Project',
      publicRegister
    })

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#publicRegisterCheckAnswersController', () => {
    test('redirects to the reason page when the answers are not finished', () => {
      mockCache(nationalSecurity)
      const h = createH()

      publicRegisterCheckAnswersController.handler({ headers: {} }, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('renders the answers with a back link to the reason page', () => {
      mockCache(complete)
      const h = createH()

      publicRegisterCheckAnswersController.handler({ headers: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_CHECK_ANSWERS_VIEW_ROUTE,
        expect.objectContaining({
          projectName: 'Test Project',
          summary: expect.any(Object),
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
        })
      )
    })

    test('back link goes to the task list when arriving from the task list', () => {
      mockCache(complete)
      const h = createH()

      publicRegisterCheckAnswersController.handler(
        {
          headers: {
            referer: `http://localhost${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}`
          }
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_CHECK_ANSWERS_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      )
    })
  })

  describe('#publicRegisterCheckAnswersSubmitController', () => {
    test('redirects to the reason page without confirming when the answers are not finished', async () => {
      mockCache(nationalSecurity)
      const h = createH()

      await publicRegisterCheckAnswersSubmitController.handler({}, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
      )
      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
    })

    test('confirms the answers and redirects to the task list', async () => {
      mockCache(complete)
      const h = createH()
      const request = {}

      await publicRegisterCheckAnswersSubmitController.handler(request, h)

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        request,
        apiRoutes.CONFIRM_PUBLIC_REGISTER,
        { id: 'test-id' }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })
  })
})
