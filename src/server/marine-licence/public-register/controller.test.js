import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  publicRegisterController,
  publicRegisterSubmitController,
  PUBLIC_REGISTER_VIEW_ROUTE
} from '#src/server/marine-licence/public-register/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#publicRegister', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    publicRegister: {
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity'
    }
  }

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockLicence.id,
        ...mockLicence.publicRegister
      }
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#publicRegisterController', () => {
    test('Should render an empty form when the question is not yet answered', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockLicence,
        publicRegister: undefined
      })

      const h = { view: vi.fn() }

      await publicRegisterController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_VIEW_ROUTE,
        expect.objectContaining({ payload: {} })
      )
    })
  })

  describe('#publicRegisterSubmitController', () => {
    test('Should pass error to global catchAll behaviour if it contains no validation data', async () => {
      const thrownError = { res: { statusCode: 500 }, data: {} }
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        thrownError
      )
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await expect(
        publicRegisterSubmitController.handler(
          {
            payload: {
              withholdConsent: 'yes',
              withholdReason: 'nationalSecurity'
            },
            query: {}
          },
          h
        )
      ).rejects.toBe(thrownError)
      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('Should correctly redirect to the next page on success', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await publicRegisterSubmitController.handler(
        { payload: { withholdConsent: 'no' }, query: {} },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register',
        {
          id: mockLicence.id,
          withholdConsent: 'no'
        }
      )
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        expect.objectContaining({ publicRegister: { withholdConsent: 'no' } })
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('Should not save a withhold reason when no information is withheld', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await publicRegisterSubmitController.handler(
        {
          payload: {
            withholdConsent: 'no',
            withholdReason: 'nationalSecurity'
          },
          query: {}
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register',
        { id: mockLicence.id, withholdConsent: 'no' }
      )
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        expect.objectContaining({ publicRegister: { withholdConsent: 'no' } })
      )
    })

    test('Should correctly redirect to check your answers when parameter is present', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await publicRegisterSubmitController.handler(
        {
          payload: {
            withholdConsent: 'yes',
            withholdReason: 'nationalSecurity'
          },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register',
        {
          id: mockLicence.id,
          withholdConsent: 'yes',
          withholdReason: 'nationalSecurity'
        }
      )
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        expect.objectContaining({
          publicRegister: {
            withholdConsent: 'yes',
            withholdReason: 'nationalSecurity'
          }
        })
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })

    test('Should handle API validation errors in catch block', async () => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        {
          data: {
            payload: {
              validation: {
                details: [
                  {
                    field: 'withholdReason',
                    message: 'PUBLIC_REGISTER_WITHHOLD_REASON_REQUIRED',
                    type: 'any.required'
                  }
                ]
              }
            }
          }
        }
      )

      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await publicRegisterSubmitController.handler(
        {
          payload: {
            withholdConsent: 'yes',
            withholdReason: 'nationalSecurity'
          },
          query: {}
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          payload: {
            withholdConsent: 'yes',
            withholdReason: 'nationalSecurity'
          },
          errors: expect.objectContaining({
            withholdReason: expect.objectContaining({
              text: 'Select a reason why you want to withhold information'
            })
          })
        })
      )
    })
  })
})
