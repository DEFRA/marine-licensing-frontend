import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  setupTestServer,
  mockMarineLicence
} from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { JSDOM } from 'jsdom'
import {
  otherAuthoritiesController,
  otherAuthoritiesSubmitController,
  OTHER_AUTHORITIES_VIEW_ROUTE,
  errorMessages
} from '#src/server/marine-licence/other-authorities/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#otherAuthorities', () => {
  const getServer = setupTestServer()
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    otherAuthorities: { agree: 'yes', details: 'Applied to harbour authority' }
  }

  beforeEach(() => {
    mockMarineLicence(mockLicence)
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
    test('Should provide expected response', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
        server: getServer()
      })
      expect(result).toEqual(
        expect.stringContaining(
          'Have you applied to, or got permission from, any other authorities in relation to this project?'
        )
      )
      expect(statusCode).toBe(statusCodes.ok)
    })

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
    test('Should correctly redirect to the next page on success', async () => {
      const { statusCode, headers } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
        server: getServer(),
        formData: { agree: 'no' }
      })
      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/other-authorities',
        {
          id: mockLicence.id,
          agree: 'no'
        }
      )
      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('Should pass error to global catchAll behaviour if it contains no validation data', async () => {
      const patchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      patchMock.mockRejectedValueOnce({ res: { statusCode: 500 }, data: {} })
      const { result } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
        server: getServer(),
        formData: { agree: 'yes', details: 'Applied to harbour authority' }
      })
      expect(result).toContain('Try again later.')
      const { document } = new JSDOM(result).window
      expect(document.querySelector('h1').textContent.trim()).toBe(
        'There is a problem with the service'
      )
    })

    test('Should handle API validation errors in catch block', async () => {
      const patchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      patchMock.mockRejectedValueOnce({
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
      })
      const { result, statusCode } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
        server: getServer(),
        formData: { agree: 'yes', details: 'Applied to harbour authority' }
      })
      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain(
        'Have you applied to, or got permission from, any other authorities in relation to this project?'
      )
      const { document } = new JSDOM(result).window
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    })

    test('Should handle API validation errors in catch block with from=check-your-answers parameter', async () => {
      const patchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      patchMock.mockRejectedValueOnce({
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
      })
      const { result, statusCode } = await makePostRequest({
        url:
          marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES +
          '?from=check-your-answers',
        server: getServer(),
        formData: { agree: 'yes', details: 'Applied to harbour authority' }
      })
      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain(
        'Have you applied to, or got permission from, any other authorities in relation to this project?'
      )
      expect(result).toContain(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
      const { document } = new JSDOM(result).window
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
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

    test('Should show error messages without calling the back end when payload data is empty', async () => {
      const patchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      const { result } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
        server: getServer(),
        formData: { agree: '' }
      })
      expect(patchMock).not.toHaveBeenCalled()
      const { document } = new JSDOM(result).window
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    })

    test('Should correctly redirect to check your answers when parameter is present', async () => {
      const { statusCode, headers } = await makePostRequest({
        url:
          marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES +
          '?from=check-your-answers',
        server: getServer(),
        formData: { agree: 'yes', details: 'Applied to harbour authority' }
      })
      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/other-authorities',
        {
          id: mockLicence.id,
          agree: 'yes',
          details: 'Applied to harbour authority'
        }
      )
      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })

    test('Should show error for details being empty when agree is set to yes', async () => {
      const patchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      const { result } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
        server: getServer(),
        formData: { agree: 'yes' }
      })
      expect(patchMock).not.toHaveBeenCalled()
      const { document } = new JSDOM(result).window
      expect(result).toEqual(
        expect.stringContaining(
          errorMessages.OTHER_AUTHORITIES_DETAILS_REQUIRED
        )
      )
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
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
