import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { JSDOM } from 'jsdom'
import {
  projectNameSubmitController,
  PROJECT_NAME_VIEW_ROUTE
} from '~/src/server/exemption/project-name/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#projectName', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  const mockExemptionState = { projectName: 'Test Project' }

  beforeEach(() => {
    jest
      .spyOn(authRequests, 'authenticatedPostRequest')
      .mockReturnValue({ payload: { id: mockExemption.id } })

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)
  })

  describe('#projectNameController', () => {
    test('Should return success response code', async () => {
      const { statusCode } = await getServer().inject({
        method: 'GET',
        url: routes.PROJECT_NAME
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('#projectNameSubmitController', () => {
    test('Should correctly create new project and redirect to the next page on success', async () => {
      const apiPostMock = jest.spyOn(authRequests, 'authenticatedPostRequest')
      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      const { statusCode, headers } = await getServer().inject({
        method: 'POST',
        url: routes.PROJECT_NAME,
        payload: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/exemption/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          mcmsContext: null
        })
      )

      expect(statusCode).toBe(302)

      expect(headers.location).toBe(routes.TASK_LIST)
    })

    test('Should correctly update existing project and redirect to the next page on success', async () => {
      getExemptionCacheSpy.mockReturnValueOnce(mockExemption)

      const apiPatchMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')
      apiPatchMock.mockResolvedValue({
        payload: { projectName: 'Project name' }
      })

      const { statusCode, headers } = await getServer().inject({
        method: 'POST',
        url: routes.PROJECT_NAME,
        payload: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/exemption/project-name`,
        { projectName: 'Project name', id: mockExemption.id }
      )

      expect(statusCode).toBe(302)

      expect(headers.location).toBe(routes.TASK_LIST)
    })

    test('Should pass error to global catchAll behaviour if it is not a validation error', async () => {
      const apiPostMock = jest.spyOn(authRequests, 'authenticatedPostRequest')
      apiPostMock.mockRejectedValueOnce({
        res: { statusCode: 500 },
        data: {}
      })

      const { result } = await getServer().inject({
        method: 'POST',
        url: routes.PROJECT_NAME,
        payload: { projectName: 'test' }
      })

      expect(result).toContain('Something went wrong')

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe('500')
    })

    test('Should correctly validate on empty data', () => {
      const request = {
        payload: { projectName: '' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['projectName'],
            message: 'TEST',
            type: 'string.empty'
          }
        ]
      }

      projectNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(PROJECT_NAME_VIEW_ROUTE, {
        heading: 'Project Name',
        pageTitle: 'Project name',
        payload: { projectName: '' },
        errorSummary: [
          {
            href: '#projectName',
            text: 'TEST',
            field: ['projectName']
          }
        ],
        errors: {
          projectName: {
            field: ['projectName'],
            href: '#projectName',
            text: 'TEST'
          }
        }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly handle an incorrectly formed error object', () => {
      const request = {
        payload: { projectName: '' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: null
      }

      projectNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(PROJECT_NAME_VIEW_ROUTE, {
        heading: 'Project Name',
        pageTitle: 'Project name',
        payload: { projectName: '' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on empty data and handle a scenario where error details are missing', () => {
      const request = {
        payload: { projectName: '' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      projectNameSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(PROJECT_NAME_VIEW_ROUTE, {
        heading: 'Project Name',
        pageTitle: 'Project name',
        payload: { projectName: '' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should not call the back end when payload data is empty', async () => {
      const apiPostMock = jest.spyOn(authRequests, 'authenticatedPostRequest')

      await getServer().inject({
        method: 'POST',
        url: routes.PROJECT_NAME,
        payload: { projectName: '' }
      })

      expect(apiPostMock).not.toHaveBeenCalled()
    })

    test('Should correctly set the cache when submitting a project name', async () => {
      const h = {
        redirect: jest.fn().mockReturnValue({
          takeover: jest.fn()
        }),
        view: jest.fn()
      }

      const mockRequest = {
        payload: { projectName: 'Project name' },
        yar: {
          flash: jest.fn().mockReturnValue([])
        },
        url: 'http://example.com/project-name',
        logger: { error: jest.fn() }
      }

      await projectNameSubmitController.handler(mockRequest, h)

      expect(cacheUtils.setExemptionCache).toHaveBeenCalledWith(mockRequest, {
        projectName: 'Project name'
      })
    })

    test('Should correctly retrieve cached MCMS context when creating a new exemption', async () => {
      const h = { redirect: jest.fn() }
      const apiPostMock = jest.spyOn(authRequests, 'authenticatedPostRequest')
      const mockMcmsContext = {
        activityType: 'CON',
        activitySubtype: 'maintenance',
        article: '17',
        pdfDownloadUrl: 'https://example.com/test.pdf'
      }
      const mockRequest = {
        payload: { projectName: 'Project name' },
        yar: {
          flash: jest.fn().mockReturnValue([mockMcmsContext])
        }
      }

      await projectNameSubmitController.handler(mockRequest, h)

      expect(apiPostMock.mock.calls[0][2]).toEqual({
        mcmsContext: {
          activitySubtype: 'maintenance',
          activityType: 'CON',
          article: '17',
          pdfDownloadUrl: 'https://example.com/test.pdf'
        },
        projectName: 'Project name'
      })
    })

    test('Should handle missing MCMS context when creating a new exemption', async () => {
      const h = { redirect: jest.fn() }
      const mockRequest = {
        payload: { projectName: 'Project name' },
        yar: {
          flash: jest.fn().mockReturnValue([])
        },
        url: 'http://example.com/project-name',
        logger: { error: jest.fn() }
      }

      await projectNameSubmitController.handler(mockRequest, h)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext')
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
