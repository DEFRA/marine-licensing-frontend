import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  otherAuthoritiesController,
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
    vi.restoreAllMocks()
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

  describe('#otherAuthoritiesController', () => {
    test('otherAuthoritiesController handler should render with correct context', async () => {
      const h = { view: vi.fn() }

      await otherAuthoritiesController.handler({}, h)
      expect(h.view).toHaveBeenCalledWith(OTHER_AUTHORITIES_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        heading:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        projectName: mockLicence.projectName,
        payload: mockLicence.otherAuthorities
      })
    })
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

    test('Should show error messages without calling the back end when payload data is empty', () => {
      const request = { payload: { agree: '' } }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      const err = {
        details: [
          {
            path: ['agree'],
            message: 'TEST',
            type: 'string.empty'
          }
        ]
      }

      otherAuthoritiesSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(h.view).toHaveBeenCalled()
    })

    test('Should show error for details being empty when agree is set to yes', () => {
      const request = { payload: { agree: 'yes', details: '' } }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      const err = {
        details: [
          {
            path: ['details'],
            message: 'OTHER_AUTHORITIES_DETAILS_REQUIRED',
            type: 'string.empty'
          }
        ]
      }

      otherAuthoritiesSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(h.view).toHaveBeenCalled()
    })

    test('Should correctly validate on empty data', () => {
      const request = { payload: { agree: '' } }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
      const err = {
        details: [{ path: ['agree'], message: 'TEST', type: 'string.empty' }]
      }
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
        payload: { agree: '' },
        errorSummary: [{ href: '#agree', text: 'TEST', field: ['agree'] }],
        errors: {
          agree: { field: ['agree'], href: '#agree', text: 'TEST' }
        }
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly handle an incorrectly formed error object', () => {
      const request = { payload: { agree: '' } }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
      const err = { details: null }
      otherAuthoritiesSubmitController.options.validate.failAction(
        request,
        h,
        err
      )
      expect(h.view).toHaveBeenCalledWith(OTHER_AUTHORITIES_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        heading:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        pageTitle:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        projectName: mockLicence.projectName,
        payload: { agree: '' }
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on empty data and handle a scenario where error details are missing', () => {
      const request = { payload: { agree: '' } }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
      otherAuthoritiesSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )
      expect(h.view).toHaveBeenCalledWith(OTHER_AUTHORITIES_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        heading:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        pageTitle:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        projectName: mockLicence.projectName,
        payload: { agree: '' }
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on invalid data', () => {
      const request = { payload: { agree: 'invalid' } }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
      otherAuthoritiesSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )
      expect(h.view).toHaveBeenCalledWith(OTHER_AUTHORITIES_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        heading:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        pageTitle:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        projectName: mockLicence.projectName,
        payload: { agree: 'invalid' }
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly set the cache when submitting other authorities', async () => {
      const setCacheMock = vi.spyOn(cacheUtils, 'setMarineLicenceCache')
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }
      const mockRequest = {
        payload: { agree: 'yes', details: 'Applied to harbour authority' }
      }
      await otherAuthoritiesSubmitController.handler(mockRequest, h)
      expect(setCacheMock).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Object),
        expect.objectContaining(mockLicence)
      )
    })
  })
})
