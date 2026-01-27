import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { JSDOM } from 'jsdom'
import {
  projectNameSubmitController,
  PROJECT_NAME_VIEW_ROUTE
} from '#src/server/marine-license/project-name/controller.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'

vi.mock('#src/server/common/helpers/session-cache/utils.js')
vi.mock('#src/server/common/plugins/auth/utils.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')

describe('#marineLicense/projectName', () => {
  const getServer = setupTestServer()

  let apiPostMock
  let getUserSessionMock

  beforeAll(() => {
    config.set('marineLicense.enabled', true)
    apiPostMock = vi.mocked(authenticatedPostRequest)
    getUserSessionMock = vi.mocked(getUserSession).mockResolvedValue({
      organisationId: 'test-org-id',
      organisationName: 'Test Organisation Ltd'
    })
  })

  afterAll(() => {
    config.set('marineLicense.enabled', false)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('#projectNameController', () => {
    test('Should correctly throw an error if feature is disabled', async () => {
      config.set('marineLicense.enabled', false)

      const { statusCode, headers } = await makeGetRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer()
      })

      expect(statusCode).toBe(403)

      expect(headers.location).toBe(marineLicenseRoutes.TASK_LIST)

      config.set('marineLicense.enabled', true)
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

      expect(requestWithError.headers.location).toBe(
        marineLicenseRoutes.TASK_LIST
      )

      const requestWithoutError = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(requestWithoutError.statusCode).toBe(403)

      expect(requestWithoutError.headers.location).toBe(
        marineLicenseRoutes.TASK_LIST
      )

      config.set('marineLicense.enabled', true)
    })

    test('Should correctly create new project and stay on same page', async () => {
      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { projectName: 'test' }
      })

      const { statusCode, headers } = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          mcmsContext: null,
          organisationId: 'test-org-id',
          organisationName: 'Test Organisation Ltd'
        })
      )

      expect(statusCode).toBe(200)

      expect(headers.location).toBe(marineLicenseRoutes.TASK_LIST)
    })

    test('Should handle API validation errors in catch block', async () => {
      apiPostMock.mockRejectedValueOnce({
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

      const { document } = new JSDOM(result).window
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
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
        backLink: marineLicenseRoutes.TASK_LIST,
        heading: 'Project Name',
        pageTitle: 'Project name',
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
        backLink: marineLicenseRoutes.TASK_LIST,
        heading: 'Project Name',
        pageTitle: 'Project name',
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

      expect(apiPostMock).not.toHaveBeenCalled()
    })

    test('Should correctly retrieve cached MCMS context when creating a new marine license', async () => {
      const h = { view: vi.fn() }
      const mockMcmsContext = {
        activityType: 'CON',
        activitySubtype: 'maintenance',
        article: '17',
        pdfDownloadUrl: 'https://example.com/test.pdf'
      }
      const mockRequest = createMockRequest({
        payload: { projectName: 'Project name' },
        yar: {
          get: vi.fn().mockReturnValue(mockMcmsContext),
          clear: vi.fn()
        }
      })

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
      apiPostMock.mockRejectedValue(new Error('API error'))
      await expect(() =>
        projectNameSubmitController.handler(mockRequest, h)
      ).rejects.toThrow()

      expect(mockRequest.yar.clear).not.toHaveBeenCalled()
    })

    test('Should handle missing organisation data when creating a new marine license', async () => {
      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      const { statusCode } = await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
        expect.objectContaining({
          projectName: 'Project name',
          mcmsContext: null
        })
      )

      expect(statusCode).toBe(200)
    })

    test('Should include organisation data when user is an Agent', async () => {
      getUserSessionMock.mockResolvedValue({
        organisationId: 'beneficiary-org-id',
        organisationName: 'Beneficiary Organisation Ltd',
        userRelationshipType: 'Agent'
      })

      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
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
      getUserSessionMock.mockResolvedValue({
        organisationId: 'applicant-org-id',
        organisationName: 'Applicant Organisation Ltd',
        userRelationshipType: 'Employee'
      })

      apiPostMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      await makePostRequest({
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer(),
        formData: { projectName: 'Project name' }
      })

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        `/marine-license/project-name`,
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
