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
    publicRegister: { consent: 'no', reason: 'Some details' }
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
    test.each([
      {
        name: 'the stored answer when one exists',
        publicRegister: { consent: 'no', reason: 'Some details' },
        expected: { consent: 'yes', reason: 'Some details' }
      },
      {
        name: 'an empty form when not yet answered',
        publicRegister: undefined,
        expected: {}
      }
    ])(
      'Should pre-populate the form with $name',
      async ({ publicRegister, expected }) => {
        vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
          ...mockLicence,
          publicRegister
        })

        const h = { view: vi.fn() }

        await publicRegisterController.handler({ query: {} }, h)

        expect(h.view).toHaveBeenCalledWith(
          PUBLIC_REGISTER_VIEW_ROUTE,
          expect.objectContaining({ payload: expected })
        )
      }
    )
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
              consent: 'yes',
              reason: 'Some details'
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
        { payload: { consent: 'no' }, query: {} },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register',
        {
          id: mockLicence.id,
          consent: 'yes'
        }
      )
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        expect.objectContaining({ publicRegister: { consent: 'yes' } })
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('Should correctly redirect to check your answers when parameter is present', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await publicRegisterSubmitController.handler(
        {
          payload: { consent: 'yes', reason: 'Some details' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register',
        {
          id: mockLicence.id,
          consent: 'no',
          reason: 'Some details'
        }
      )
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        expect.objectContaining({
          publicRegister: { consent: 'no', reason: 'Some details' }
        })
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })

    test.each([
      {
        name: 'task list backlink',
        query: {},
        expectedBackLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      },
      {
        name: 'check-your-answers backlink',
        query: { from: 'check-your-answers' },
        expectedBackLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      }
    ])(
      'Should handle API validation errors in catch block with $name',
      async ({ query, expectedBackLink }) => {
        vi.spyOn(
          authRequests,
          'authenticatedPatchRequest'
        ).mockRejectedValueOnce({
          data: {
            payload: {
              validation: {
                details: [
                  {
                    field: 'reason',
                    message: 'PUBLIC_REGISTER_REASON_REQUIRED',
                    type: 'any.required'
                  }
                ]
              }
            }
          }
        })

        const h = {
          redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
          view: vi.fn()
        }

        await publicRegisterSubmitController.handler(
          {
            payload: {
              consent: 'yes',
              reason: 'Some details'
            },
            query
          },
          h
        )

        expect(h.view).toHaveBeenCalledWith(
          PUBLIC_REGISTER_VIEW_ROUTE,
          expect.objectContaining({
            backLink: expectedBackLink,
            payload: {
              consent: 'yes',
              reason: 'Some details'
            }
          })
        )
      }
    )
  })
})
