import { vi } from 'vitest'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'
import {
  setupTestServer,
  mockMarineLicense
} from '#tests/integration/shared/test-setup-helpers.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
import * as mcmsContextCache from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import {
  projectNameSubmitController,
  PROJECT_NAME_VIEW_ROUTE
} from '#src/server/marine-license/project-name/controller.js'

describe('#marineLicense/projectName', () => {
  const getServer = setupTestServer()

  let authenticatedPatchRequestMock
  let authenticatedPostRequestMock
  let getMcmsContextFromCacheMock
  let getUserSessionMock

  beforeEach(() => {
    mockMarineLicense({ projectName: 'Test Project', id: 'test-id' })

    authenticatedPatchRequestMock = vi.spyOn(
      authRequests,
      'authenticatedPatchRequest'
    )

    authenticatedPostRequestMock = vi.spyOn(
      authRequests,
      'authenticatedPostRequest'
    )

    getMcmsContextFromCacheMock = vi.spyOn(
      mcmsContextCache,
      'getMcmsContextFromCache'
    )

    getUserSessionMock = vi
      .spyOn(authUtils, 'getUserSession')
      .mockResolvedValue({
        organisationId: 'test-org-id',
        organisationName: 'Test Organisation Ltd'
      })
  })

  describe('#projectNameController', () => {
    test('Should correctly throw an error if feature is disabled', async () => {
      config.set('marineLicense.enabled', false)

      const { statusCode } = await makeGetRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer()
      })

      expect(statusCode).toBe(403)

      config.set('marineLicense.enabled', true)
    })

    test('Should correctly continue in controller if not disabled', async () => {
      const { statusCode } = await makeGetRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer()
      })

      expect(statusCode).toBe(200)
    })
  })

  describe('#projectNameSubmitController', () => {
    test('Should correctly throw an error if feature is disabled', async () => {
      config.set('marineLicense.enabled', false)

      const requestWithError = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer()
      })

      expect(requestWithError.statusCode).toBe(403)

      const requestWithoutError = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(requestWithoutError.statusCode).toBe(403)

      config.set('marineLicense.enabled', true)
    })

    test('Should correctly create new project and redirect to task list', async () => {
      mockMarineLicense({ projectName: 'Test Project' })

      authenticatedPostRequestMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: {
          value: {
            id: 'test-id',
            projectName: 'Project name'
          }
        }
      })

      const { statusCode, headers } = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          organisationId: 'test-org-id',
          organisationName: 'Test Organisation Ltd'
        })
      )

      expect(statusCode).toBe(302)

      expect(headers.location).toBe(
        marineLicenseRoutes.MARINE_LICENSE_TASK_LIST
      )
    })

    test('Should correctly update new project and redirect to task list', async () => {
      authenticatedPatchRequestMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: {
          value: {
            message: 'success'
          }
        }
      })

      const { statusCode, headers } = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authenticatedPatchRequestMock).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
        expect.objectContaining({
          id: 'test-id',
          projectName: 'Project name'
        })
      )

      expect(statusCode).toBe(302)

      expect(headers.location).toBe(
        marineLicenseRoutes.MARINE_LICENSE_TASK_LIST
      )
    })

    test('Should handle API validation errors in catch block', async () => {
      mockMarineLicense({ projectName: 'Test Project' })

      authenticatedPostRequestMock.mockRejectedValueOnce({
        data: {
          payload: {
            validation: {
              details: [
                {
                  path: ['projectName'],
                  message: 'PROJECT_NAME_REQUIRED',
                  type: 'string.empty'
                }
              ]
            }
          }
        }
      })

      const { result, statusCode } = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'test' }
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Project name')
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
        backLink: marineLicenseRoutes.MARINE_LICENSE_TASK_LIST,
        payload: { projectName: '' }
      })
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
        backLink: marineLicenseRoutes.MARINE_LICENSE_TASK_LIST,
        payload: { projectName: '' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should not call the back end when payload data is empty', async () => {
      await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: '' }
      })

      expect(authenticatedPostRequestMock).not.toHaveBeenCalled()
    })

    test('Should correctly retrieve cached MCMS context when creating a new marine license', async () => {
      mockMarineLicense({ projectName: 'Test Project' })

      const h = { redirect: vi.fn() }
      const mockMcmsContext = {
        activityType: 'CON',
        activitySubtype: 'maintenance',
        article: '17',
        pdfDownloadUrl: 'https://example.com/test.pdf'
      }

      getMcmsContextFromCacheMock.mockReturnValueOnce(mockMcmsContext)

      const mockRequest = createMockRequest({
        payload: { projectName: 'Project name' },
        yar: {
          get: vi.fn().mockReturnValue(mockMcmsContext),
          clear: vi.fn()
        }
      })

      authenticatedPostRequestMock.mockResolvedValueOnce({
        payload: {
          value: {
            id: 'test-id',
            projectName: 'Project name'
          }
        }
      })

      await projectNameSubmitController.handler(mockRequest, h)

      expect(authenticatedPostRequestMock.mock.calls[0][2]).toEqual({
        mcmsContext: {
          activitySubtype: 'maintenance',
          activityType: 'CON',
          article: '17',
          pdfDownloadUrl: 'https://example.com/test.pdf'
        },
        projectName: 'Project name',
        organisationId: 'test-org-id',
        organisationName: 'Test Organisation Ltd',
        userRelationshipType: undefined
      })
    })

    test('Should not clear MCMS context if an error occurs when creating a new marine license', async () => {
      const h = { redirect: vi.fn() }
      const mockRequest = createMockRequest({
        payload: { projectName: 'Project name' },
        yar: {
          get: vi.fn().mockReturnValue([]),
          clear: vi.fn()
        },
        url: 'http://example.com/project-name'
      })

      authenticatedPostRequestMock.mockRejectedValue(new Error('API error'))

      await expect(() =>
        projectNameSubmitController.handler(mockRequest, h)
      ).rejects.toThrow()

      expect(mockRequest.yar.clear).not.toHaveBeenCalled()
    })

    test('Should handle missing organisation data when creating a new marine license', async () => {
      mockMarineLicense({ projectName: 'Test Project' })

      authenticatedPostRequestMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: {
          value: {
            id: 'test-id',
            projectName: 'Project name'
          }
        }
      })

      const { statusCode } = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
        expect.objectContaining({
          projectName: 'Project name'
        })
      )

      expect(statusCode).toBe(302)
    })

    test('Should include organisation data when user is an Agent', async () => {
      mockMarineLicense({ projectName: 'Test Project' })

      getUserSessionMock.mockResolvedValue({
        organisationId: 'beneficiary-org-id',
        organisationName: 'Beneficiary Organisation Ltd',
        userRelationshipType: 'Agent'
      })

      authenticatedPostRequestMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { id: 'test-id' }
      })

      await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          organisationId: 'beneficiary-org-id',
          organisationName: 'Beneficiary Organisation Ltd',
          userRelationshipType: 'Agent'
        })
      )

      const callArgs = authenticatedPostRequestMock.mock.calls[0][2]
      expect(callArgs).toHaveProperty('organisationId')
      expect(callArgs).toHaveProperty('organisationName')
    })

    test('Should include organisation data when user is an Employee', async () => {
      mockMarineLicense({ projectName: 'Test Project' })

      getUserSessionMock.mockResolvedValue({
        organisationId: 'applicant-org-id',
        organisationName: 'Applicant Organisation Ltd',
        userRelationshipType: 'Employee'
      })

      authenticatedPostRequestMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { id: 'test-id' }
      })

      await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          organisationId: 'applicant-org-id',
          organisationName: 'Applicant Organisation Ltd',
          userRelationshipType: 'Employee'
        })
      )

      const callArgs = authenticatedPostRequestMock.mock.calls[0][2]
      expect(callArgs).toHaveProperty('organisationId')
      expect(callArgs).toHaveProperty('organisationName')
    })
  })
})
