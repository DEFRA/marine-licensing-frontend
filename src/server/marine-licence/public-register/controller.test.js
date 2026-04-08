import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  publicRegisterSubmitController,
  PUBLIC_REGISTER_VIEW_ROUTE
} from '#src/server/marine-licence/public-register/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#publicRegister', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    publicRegister: { consent: 'no', details: 'Some details' }
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
            payload: { consent: 'no', details: 'Some details' },
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
        { payload: { consent: 'yes' }, query: {} },
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
          payload: { consent: 'no', details: 'Some details' },
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
          details: 'Some details'
        }
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
                    path: ['consent'],
                    message: 'PUBLIC_REGISTER_DETAILS_REQUIRED',
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
            payload: { consent: 'no', details: 'Some details' },
            query
          },
          h
        )

        expect(h.view).toHaveBeenCalledWith(
          PUBLIC_REGISTER_VIEW_ROUTE,
          expect.objectContaining({
            backLink: expectedBackLink,
            payload: { consent: 'no', details: 'Some details' }
          })
        )
      }
    )

    test.each([
      {
        name: 'null error details',
        payload: { consent: '' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { consent: '' },
        err: {},
        expectedExtra: {}
      },
      {
        name: 'invalid consent value',
        payload: { consent: 'invalid' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'Should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const request = { payload }
        const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
        publicRegisterSubmitController.options.validate.failAction(
          request,
          h,
          err
        )
        expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          pageTitle: 'Sharing your project information publicly',
          heading: 'Sharing your project information publicly',
          projectName: mockLicence.projectName,
          payload,
          ...expectedExtra
        })
        expect(h.view().takeover).toHaveBeenCalled()
      }
    )
  })
})
