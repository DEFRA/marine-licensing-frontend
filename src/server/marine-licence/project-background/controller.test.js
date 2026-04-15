import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  projectBackgroundController,
  projectBackgroundSubmitController,
  PROJECT_BACKGROUND_VIEW_ROUTE
} from '#src/server/marine-licence/project-background/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#projectBackground', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    projectBackground: 'Some background information'
  }

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockLicence.id,
        projectBackground: mockLicence.projectBackground
      }
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  describe('#projectBackgroundController', () => {
    test('should render view with project data from cache', async () => {
      const h = { view: vi.fn() }
      await projectBackgroundController.handler({ query: {} }, h)
      expect(h.view).toHaveBeenCalledWith(PROJECT_BACKGROUND_VIEW_ROUTE, {
        pageTitle: 'Project background',
        heading: 'Project background',
        projectName: mockLicence.projectName,
        payload: { projectBackground: mockLicence.projectBackground },
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      })
    })
  })

  describe('#projectBackgroundSubmitController', () => {
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
        projectBackgroundSubmitController.handler(
          {
            payload: { projectBackground: 'Some background information' },
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

      await projectBackgroundSubmitController.handler(
        {
          payload: { projectBackground: 'Some background information' },
          query: {}
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/project-background',
        {
          id: mockLicence.id,
          projectBackground: 'Some background information'
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

      await projectBackgroundSubmitController.handler(
        {
          payload: { projectBackground: 'Some background information' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/project-background',
        {
          id: mockLicence.id,
          projectBackground: 'Some background information'
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
                    path: ['background'],
                    message: 'PROJECT_BACKGROUND_REQUIRED',
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

      await projectBackgroundSubmitController.handler(
        {
          payload: { projectBackground: 'Some background information' },
          query: {}
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        PROJECT_BACKGROUND_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          payload: { projectBackground: 'Some background information' }
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
                    path: ['background'],
                    message: 'PROJECT_BACKGROUND_REQUIRED',
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

      await projectBackgroundSubmitController.handler(
        {
          payload: { projectBackground: 'Some background information' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        PROJECT_BACKGROUND_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
          payload: { projectBackground: 'Some background information' }
        })
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { projectBackground: '' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { projectBackground: '' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'Should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const request = { payload }
        const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
        projectBackgroundSubmitController.options.validate.failAction(
          request,
          h,
          err
        )
        expect(h.view).toHaveBeenCalledWith(PROJECT_BACKGROUND_VIEW_ROUTE, {
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          pageTitle: 'Project background',
          heading: 'Project background',
          projectName: mockLicence.projectName,
          payload,
          ...expectedExtra
        })
        expect(h.view().takeover).toHaveBeenCalled()
      }
    )
  })
})
