import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  otherAuthoritiesSubmitController,
  OTHER_AUTHORITIES_VIEW_ROUTE
} from '#src/server/marine-licence/other-authorities/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#otherAuthorities', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    otherAuthorities: { agree: 'yes', details: 'Applied to harbour authority' }
  }

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockLicence.id,
        ...mockLicence.otherAuthorities
      }
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#otherAuthoritiesSubmitController', () => {
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
        otherAuthoritiesSubmitController.handler(
          {
            payload: { agree: 'yes', details: 'Applied to harbour authority' },
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

      await otherAuthoritiesSubmitController.handler(
        { payload: { agree: 'no' }, query: {} },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/other-authorities',
        {
          id: mockLicence.id,
          agree: 'no'
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

      await otherAuthoritiesSubmitController.handler(
        {
          payload: { agree: 'yes', details: 'Applied to harbour authority' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/other-authorities',
        {
          id: mockLicence.id,
          agree: 'yes',
          details: 'Applied to harbour authority'
        }
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
                    path: ['agree'],
                    message: 'OTHER_AUTHORITIES_DETAILS_REQUIRED',
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

      await otherAuthoritiesSubmitController.handler(
        {
          payload: { agree: 'yes', details: 'Applied to harbour authority' },
          query: {}
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        OTHER_AUTHORITIES_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          payload: { agree: 'yes', details: 'Applied to harbour authority' }
        })
      )
    })

    test('Should handle API validation errors in catch block with from=check-your-answers parameter', async () => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        {
          data: {
            payload: {
              validation: {
                details: [
                  {
                    path: ['agree'],
                    message: 'OTHER_AUTHORITIES_DETAILS_REQUIRED',
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

      await otherAuthoritiesSubmitController.handler(
        {
          payload: { agree: 'yes', details: 'Applied to harbour authority' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        OTHER_AUTHORITIES_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
          payload: { agree: 'yes', details: 'Applied to harbour authority' }
        })
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { agree: '' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { agree: '' },
        err: {},
        expectedExtra: {}
      },
      {
        name: 'invalid agree value',
        payload: { agree: 'invalid' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'Should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const request = { payload }
        const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
        otherAuthoritiesSubmitController.options.validate.failAction(
          request,
          h,
          err
        )
        expect(h.view).toHaveBeenCalledWith(OTHER_AUTHORITIES_VIEW_ROUTE, {
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          pageTitle:
            'Have you applied to, or got permission from, any other authorities in relation to this project?',
          heading:
            'Have you applied to, or got permission from, any other authorities in relation to this project?',
          projectName: mockLicence.projectName,
          payload,
          ...expectedExtra
        })
        expect(h.view().takeover).toHaveBeenCalled()
      }
    )
  })
})
