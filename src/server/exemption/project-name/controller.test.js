import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { routes } from '#src/server/common/constants/routes.js'
import { mockExemption } from '#src/server/test-helpers/mocks.js'
import { JSDOM } from 'jsdom'
import {
  projectNameSubmitController,
  PROJECT_NAME_VIEW_ROUTE
} from '#src/server/exemption/project-name/controller.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#projectName', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  const mockExemptionState = { projectName: 'Test Project' }

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPostRequest').mockReturnValue({
      payload: { id: mockExemption.id }
    })

    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)

    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
      organisationId: 'test-org-id',
      organisationName: 'Test Organisation Ltd'
    })
  })

  describe('#projectNameController', () => {
    test('Should return success response code', async () => {
      const { statusCode } = await makeGetRequest({
        server: getServer(),
        url: routes.PROJECT_NAME
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('#projectNameSubmitController', () => {
    test('Should correctly create new project and redirect to the next page on success', async () => {
      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPostRequest')
      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      const { statusCode, headers } = await makePostRequest({
        url: routes.PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/exemption/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          mcmsContext: null,
          organisationId: 'test-org-id',
          organisationName: 'Test Organisation Ltd'
        })
      )

      expect(statusCode).toBe(302)

      expect(headers.location).toBe(routes.TASK_LIST)
    })

    test('Should correctly update existing project and redirect to the next page on success', async () => {
      getExemptionCacheSpy.mockReturnValueOnce(mockExemption)

      const apiPatchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      apiPatchMock.mockResolvedValue({
        payload: { projectName: 'Project name' }
      })

      const { statusCode, headers } = await makePostRequest({
        url: routes.PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
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
      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPostRequest')
      apiPostMock.mockRejectedValueOnce({
        res: { statusCode: 500 },
        data: {}
      })

      const { result } = await makePostRequest({
        url: routes.PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'test' }
      })

      expect(result).toContain('There is a problem with the service')

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'There is a problem with the service'
      )
    })

    test('Should correctly validate on empty data', () => {
      const request = {
        payload: { projectName: '' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPostRequest')

      await makePostRequest({
        url: routes.PROJECT_NAME,
        server: getServer(),
        formData: { projectName: '' }
      })

      expect(apiPostMock).not.toHaveBeenCalled()
    })

    test('Should correctly set the cache when submitting a project name', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        view: vi.fn()
      }

      const mockRequest = {
        payload: { projectName: 'Project name' },
        yar: {
          flash: vi.fn().mockReturnValue([])
        },
        url: 'http://example.com/project-name',
        logger: { error: vi.fn() }
      }

      await projectNameSubmitController.handler(mockRequest, h)

      expect(cacheUtils.setExemptionCache).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Object),
        {
          projectName: 'Project name'
        }
      )
    })

    test('Should correctly retrieve cached MCMS context when creating a new exemption', async () => {
      const h = { redirect: vi.fn() }
      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPostRequest')
      const mockMcmsContext = {
        activityType: 'CON',
        activitySubtype: 'maintenance',
        article: '17',
        pdfDownloadUrl: 'https://example.com/test.pdf'
      }
      const mockRequest = {
        payload: { projectName: 'Project name' },
        yar: {
          flash: vi.fn().mockReturnValue([mockMcmsContext])
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
        projectName: 'Project name',
        organisationId: 'test-org-id',
        organisationName: 'Test Organisation Ltd'
      })
    })

    test('Should handle missing MCMS context when creating a new exemption', async () => {
      const h = { redirect: vi.fn() }
      const mockRequest = {
        payload: { projectName: 'Project name' },
        yar: {
          flash: vi.fn().mockReturnValue([])
        },
        url: 'http://example.com/project-name',
        logger: { error: vi.fn() }
      }

      await projectNameSubmitController.handler(mockRequest, h)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('mcmsContext')
    })

    test('Should handle missing organisation data when creating a new exemption', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({})

      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPostRequest')
      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      const { statusCode } = await makePostRequest({
        url: routes.PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
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
    })

    test('Should include organisation data when user is an Agent', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        organisationId: 'beneficiary-org-id',
        organisationName: 'Beneficiary Organisation Ltd',
        userRelationshipType: 'Agent'
      })

      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPostRequest')
      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      await makePostRequest({
        url: routes.PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/exemption/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          mcmsContext: null,
          organisationId: 'beneficiary-org-id',
          organisationName: 'Beneficiary Organisation Ltd',
          userRelationshipType: 'Agent'
        })
      )

      const callArgs = apiPostMock.mock.calls[0][2]
      expect(callArgs).toHaveProperty('organisationId')
      expect(callArgs).toHaveProperty('organisationName')
    })

    test('Should include organisation data when user is an Employee', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        organisationId: 'applicant-org-id',
        organisationName: 'Applicant Organisation Ltd',
        userRelationshipType: 'Employee'
      })

      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPostRequest')
      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      await makePostRequest({
        url: routes.PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/exemption/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          mcmsContext: null,
          organisationId: 'applicant-org-id',
          organisationName: 'Applicant Organisation Ltd',
          userRelationshipType: 'Employee'
        })
      )

      const callArgs = apiPostMock.mock.calls[0][2]
      expect(callArgs).toHaveProperty('organisationId')
      expect(callArgs).toHaveProperty('organisationName')
    })
  })
})
