import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import {
  publicRegisterController,
  publicRegisterSubmitController,
  PUBLIC_REGISTER_VIEW_ROUTE,
  errorMessages
} from '~/src/server/exemption/public-register/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#publicRegister', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy

  const mockPublicRegisterState = {
    projectName: 'Test Project',
    publicRegister: { consent: 'yes', reason: 'Test reason' }
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockExemption.id,
        ...mockExemption.publicRegister
      }
    })

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#publicRegisterController', () => {
    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.PUBLIC_REGISTER
      })

      expect(result).toEqual(
        expect.stringContaining(
          `Public register | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'Public register'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      expect(document.querySelector('#consent').value).toBe(
        mockExemption.publicRegister.consent
      )

      expect(
        document
          .querySelector('.govuk-back-link[href="/exemption/task-list"')
          .textContent.trim()
      ).toBe('Back')

      expect(
        document
          .querySelector('.govuk-link[href="/exemption/task-list"')
          .textContent.trim()
      ).toBe('Cancel')

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should provide expected response and correctly not pre populate data if it is not present', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({})

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.PUBLIC_REGISTER
      })

      expect(result).toEqual(
        expect.stringContaining(
          `Public register | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window

      expect(document.querySelector('#consent').value).toBe('yes')
      expect(document.querySelector('#consent:checked')).toBeFalsy()
      expect(document.querySelector('#consent-2').value).toBe('no')

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('publicRegisterController handler should render with correct context', () => {
      const h = { view: jest.fn() }

      publicRegisterController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
        pageTitle: 'Public register',
        heading: 'Public register',
        projectName: mockPublicRegisterState.projectName,
        payload: {
          ...mockPublicRegisterState.publicRegister
        }
      })

      getExemptionCacheSpy.mockResolvedValueOnce(null)

      publicRegisterController.handler({}, h)

      expect(h.view).toHaveBeenNthCalledWith(2, PUBLIC_REGISTER_VIEW_ROUTE, {
        pageTitle: 'Public register',
        heading: 'Public register',
        projectName: undefined,
        payload: undefined
      })
    })
  })

  describe('#publicRegisterSubmitController', () => {
    test('Should correctly redirect to the next page on success', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: routes.PUBLIC_REGISTER,
        payload: { consent: 'yes', reason: 'Test reason' }
      })

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/public-register',
        {
          id: mockExemption.id,
          consent: 'yes',
          reason: 'Test reason'
        }
      )

      expect(statusCode).toBe(302)

      expect(headers.location).toBe('/exemption/task-list')
    })

    test('Should show error messages with invalid data', async () => {
      const apiPostMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')
      apiPostMock.mockRejectedValueOnce({
        res: { statusCode: 200 },
        data: {
          payload: {
            validation: {
              source: 'payload',
              keys: ['consent'],
              details: [
                {
                  field: 'consent',
                  message: 'PUBLIC_REGISTER_CONSENT_REQUIRED',
                  type: 'string.empty'
                }
              ]
            }
          }
        }
      })

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.PUBLIC_REGISTER,
        payload: { consent: 'no' }
      })

      expect(result).toEqual(
        expect.stringContaining(errorMessages.PUBLIC_REGISTER_CONSENT_REQUIRED)
      )

      const { document } = new JSDOM(result).window

      expect(
        document.querySelector('.govuk-error-message').textContent.trim()
      ).toBe(`Error: ${errorMessages.PUBLIC_REGISTER_CONSENT_REQUIRED}`)

      expect(document.querySelector('h2').textContent.trim()).toBe(
        'There is a problem'
      )

      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should pass error to global catchAll behaviour if it contains no validation data', async () => {
      const apiPostMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')
      apiPostMock.mockRejectedValueOnce({
        res: { statusCode: 500 },
        data: {}
      })

      const { result } = await server.inject({
        method: 'POST',
        url: routes.PUBLIC_REGISTER,
        payload: { consent: 'no' }
      })

      expect(result).toContain('Something went wrong')

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe('500')
    })

    test('Should correctly validate on empty data', () => {
      const request = {
        payload: { consent: '' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['consent'],
            message: 'TEST',
            type: 'string.empty'
          }
        ]
      }

      publicRegisterSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
        pageTitle: 'Public register',
        heading: 'Public register',
        projectName: mockExemption.projectName,
        payload: { consent: '' },
        errorSummary: [
          {
            href: '#consent',
            text: 'TEST',
            field: ['consent']
          }
        ],
        errors: {
          consent: {
            field: ['consent'],
            href: '#consent',
            text: 'TEST'
          }
        }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly handle an incorrectly formed error object', () => {
      const request = {
        payload: { consent: '' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: null
      }

      publicRegisterSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
        heading: 'Public register',
        pageTitle: 'Public register',
        projectName: 'Test Project',
        payload: { consent: '' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on empty data and handle a scenario where error details are missing', () => {
      const request = {
        payload: { consent: '' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      publicRegisterSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
        heading: 'Public register',
        pageTitle: 'Public register',
        projectName: 'Test Project',
        payload: { consent: '' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on invalid data', () => {
      const request = {
        payload: { consent: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      publicRegisterSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
        heading: 'Public register',
        pageTitle: 'Public register',
        projectName: 'Test Project',
        payload: { consent: 'invalid' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should show error messages without calling the back end when payload data is empty', async () => {
      const apiPostMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')

      const { result } = await server.inject({
        method: 'POST',
        url: routes.PUBLIC_REGISTER,
        payload: { consent: '' }
      })

      expect(apiPostMock).not.toHaveBeenCalled()

      const { document } = new JSDOM(result).window

      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    })

    test('Should show error for reason being empty when consent is set to yes', async () => {
      const apiPostMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')

      const { result } = await server.inject({
        method: 'POST',
        url: routes.PUBLIC_REGISTER,
        payload: { consent: 'yes' }
      })

      expect(apiPostMock).not.toHaveBeenCalled()

      const { document } = new JSDOM(result).window

      expect(result).toEqual(
        expect.stringContaining(errorMessages.PUBLIC_REGISTER_REASON_REQUIRED)
      )

      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    })

    test('Should correctly set the cache when submitting public register', async () => {
      const h = {
        redirect: jest.fn().mockReturnValue({
          takeover: jest.fn()
        }),
        view: jest.fn()
      }

      const mockRequest = { payload: { consent: 'yes', reason: 'Test reason' } }

      await publicRegisterSubmitController.handler(
        { payload: { consent: 'yes', reason: 'Test reason' } },
        h
      )
      expect(cacheUtils.setExemptionCache).toHaveBeenCalledWith(
        mockRequest,
        mockExemption
      )
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
