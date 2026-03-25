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
  specialLegalPowersController,
  specialLegalPowersSubmitController,
  SPECIAL_LEGAL_POWERS_VIEW_ROUTE,
  errorMessages
} from '#src/server/marine-licence/special-legal-powers/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#specialLegalPowers', () => {
  const getServer = setupTestServer()
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    specialLegalPowers: { agree: 'yes', details: 'Test reason' }
  }

  beforeEach(() => {
    mockMarineLicence(mockLicence)
    vi.restoreAllMocks()
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockLicence.id,
        ...mockLicence.specialLegalPowers
      }
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#specialLegalPowersController', () => {
    test('Should provide expected response', async () => {
      authUtils.getUserSession.mockResolvedValue({
        userRelationshipType: 'EMPLOYEE'
      })

      const { result, statusCode } = await makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
        server: getServer()
      })
      expect(result).toEqual(
        expect.stringContaining(
          'Does your organisation have special legal powers to do any of this project?'
        )
      )
      expect(statusCode).toBe(statusCodes.ok)
    })

    test('specialLegalPowersController handler should render with correct context', async () => {
      authUtils.getUserSession.mockResolvedValue({
        userRelationshipType: 'EMPLOYEE'
      })

      const h = { view: vi.fn() }

      await specialLegalPowersController.handler({}, h)
      expect(h.view).toHaveBeenCalledWith(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'Does your organisation have special legal powers to do any of this project?',
        heading:
          'Does your organisation have special legal powers to do any of this project?',
        projectName: mockLicence.projectName,
        payload: mockLicence.specialLegalPowers
      })
    })
  })

  describe('#specialLegalPowersSubmitController', () => {
    test('Should correctly redirect to the next page on success', async () => {
      const { statusCode, headers } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
        server: getServer(),
        formData: { agree: 'no' }
      })
      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/special-legal-powers',
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
        url: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
        server: getServer(),
        formData: { agree: 'yes', details: 'Test reason' }
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
                  message: 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
                  type: 'any.required'
                }
              ]
            }
          }
        }
      })
      const { result, statusCode } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
        server: getServer(),
        formData: { agree: 'yes', details: 'Test reason' }
      })
      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain(
        'Does your organisation have special legal powers to do any of this project?'
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
                  message: 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
                  type: 'any.required'
                }
              ]
            }
          }
        }
      })
      const { result, statusCode } = await makePostRequest({
        url:
          marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS +
          '?from=check-your-answers',
        server: getServer(),
        formData: { agree: 'yes', details: 'Test reason' }
      })
      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain(
        'Does your organisation have special legal powers to do any of this project?'
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
      specialLegalPowersSubmitController.options.validate.failAction(
        request,
        h,
        err
      )
      expect(h.view).toHaveBeenCalledWith(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'Does your organisation have special legal powers to do any of this project?',
        heading:
          'Does your organisation have special legal powers to do any of this project?',
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
      specialLegalPowersSubmitController.options.validate.failAction(
        request,
        h,
        err
      )
      expect(h.view).toHaveBeenCalledWith(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        heading:
          'Does your organisation have special legal powers to do any of this project?',
        pageTitle:
          'Does your organisation have special legal powers to do any of this project?',
        projectName: mockLicence.projectName,
        payload: { agree: '' }
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on empty data and handle a scenario where error details are missing', () => {
      const request = { payload: { agree: '' } }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
      specialLegalPowersSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )
      expect(h.view).toHaveBeenCalledWith(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        heading:
          'Does your organisation have special legal powers to do any of this project?',
        pageTitle:
          'Does your organisation have special legal powers to do any of this project?',
        projectName: mockLicence.projectName,
        payload: { agree: '' }
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on invalid data', () => {
      const request = { payload: { agree: 'invalid' } }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
      specialLegalPowersSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )
      expect(h.view).toHaveBeenCalledWith(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        heading:
          'Does your organisation have special legal powers to do any of this project?',
        pageTitle:
          'Does your organisation have special legal powers to do any of this project?',
        projectName: mockLicence.projectName,
        payload: { agree: 'invalid' }
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should show error messages without calling the back end when payload data is empty', async () => {
      const patchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      const { result } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
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
          marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS +
          '?from=check-your-answers',
        server: getServer(),
        formData: { agree: 'yes', details: 'Test reason' }
      })
      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/special-legal-powers',
        {
          id: mockLicence.id,
          agree: 'yes',
          details: 'Test reason'
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
        url: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
        server: getServer(),
        formData: { agree: 'yes' }
      })
      expect(patchMock).not.toHaveBeenCalled()
      const { document } = new JSDOM(result).window
      expect(result).toEqual(
        expect.stringContaining(
          errorMessages.SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED
        )
      )
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    })

    test('Should correctly set the cache when submitting special legal powers', async () => {
      const setCacheMock = vi.spyOn(cacheUtils, 'setMarineLicenceCache')
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }
      const mockRequest = { payload: { agree: 'yes', details: 'Test reason' } }
      await specialLegalPowersSubmitController.handler(mockRequest, h)
      expect(setCacheMock).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Object),
        expect.objectContaining(mockLicence)
      )
    })
  })
})
