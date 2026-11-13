import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  publicRegisterNationalSecuritySubmitController,
  PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE
} from '#src/server/marine-licence/public-register-national-security/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

const pageUrl =
  marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY

describe('#publicRegisterNationalSecurity', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    publicRegister: {
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity'
    }
  }

  const createH = () => ({
    redirect: vi.fn(),
    view: vi.fn().mockReturnValue({ takeover: vi.fn() })
  })

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#publicRegisterNationalSecuritySubmitController', () => {
    test('keeps the check your answers query on the redirect', async () => {
      const h = createH()

      await publicRegisterNationalSecuritySubmitController.handler(
        {
          payload: { nationalSecurityApproval: 'no' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        `${pageUrl}?from=check-your-answers`
      )
    })

    test('passes errors without validation data to the global handler', async () => {
      const thrownError = { res: { statusCode: 500 }, data: {} }
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        thrownError
      )
      const h = createH()

      await expect(
        publicRegisterNationalSecuritySubmitController.handler(
          { payload: { nationalSecurityApproval: 'no' }, query: {} },
          h
        )
      ).rejects.toBe(thrownError)
      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('shows API validation errors against the field', async () => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        {
          data: {
            payload: {
              validation: {
                details: [
                  {
                    field: 'reason',
                    message:
                      'PUBLIC_REGISTER_NATIONAL_SECURITY_REASON_MAX_LENGTH',
                    type: 'string.max'
                  }
                ]
              }
            }
          }
        }
      )
      const h = createH()
      const payload = { nationalSecurityApproval: 'yes', reason: 'Details' }

      await publicRegisterNationalSecuritySubmitController.handler(
        { payload, query: {} },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE,
        expect.objectContaining({
          payload,
          backLink: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          errors: {
            reason: expect.objectContaining({
              text: 'Details of what you want withheld must be 1000 characters or fewer'
            })
          }
        })
      )
      expect(cacheUtils.setMarineLicenceCache).not.toHaveBeenCalled()
    })
  })
})
