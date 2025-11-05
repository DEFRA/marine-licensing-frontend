import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { mockExemption } from '#src/server/test-helpers/mocks.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { JSDOM } from 'jsdom'
import {
  publicRegisterController,
  publicRegisterSubmitController,
  PUBLIC_REGISTER_VIEW_ROUTE,
  errorMessages
} from '#src/server/exemption/public-register/controller.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#publicRegister', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockExemption.id,
        ...mockExemption.publicRegister
      }
    })

    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  describe('#publicRegisterController', () => {
    test('Should provide expected response', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.PUBLIC_REGISTER,
        server: getServer()
      })

      expect(result).toEqual(
        expect.stringContaining(`Sharing your project information publicly`)
      )

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('publicRegisterController handler should render with correct context', () => {
      const h = { view: vi.fn() }

      publicRegisterController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
        pageTitle: 'Sharing your project information publicly',
        heading: 'Sharing your project information publicly',
        projectName: mockExemption.projectName,
        payload: {
          ...mockExemption.publicRegister
        }
      })

      getExemptionCacheSpy.mockReturnValueOnce({})

      publicRegisterController.handler({}, h)

      expect(h.view).toHaveBeenNthCalledWith(2, PUBLIC_REGISTER_VIEW_ROUTE, {
        pageTitle: 'Sharing your project information publicly',
        heading: 'Sharing your project information publicly',
        projectName: undefined,
        payload: undefined
      })
    })
  })

  describe('#publicRegisterSubmitController', () => {
    test('Should correctly redirect to the next page on success', async () => {
      const { statusCode, headers } = await makePostRequest({
        url: routes.PUBLIC_REGISTER,
        server: getServer(),
        formData: { consent: 'no', reason: 'Test reason' }
      })

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/public-register',
        {
          id: mockExemption.id,
          consent: 'no',
          reason: 'Test reason'
        }
      )

      expect(statusCode).toBe(302)

      expect(headers.location).toBe('/exemption/task-list')
    })

    test('Should pass error to global catchAll behaviour if it contains no validation data', async () => {
      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      apiPostMock.mockRejectedValueOnce({
        res: { statusCode: 500 },
        data: {}
      })

      const { result } = await makePostRequest({
        url: routes.PUBLIC_REGISTER,
        server: getServer(),
        formData: { consent: 'no', reason: 'Test reason' }
      })

      expect(result).toContain('Try again later.')

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'There is a problem with the service'
      )
    })

    test('Should correctly validate on empty data', () => {
      const request = {
        payload: { consent: '' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        pageTitle: 'Sharing your project information publicly',
        heading: 'Sharing your project information publicly',
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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        heading: 'Sharing your project information publicly',
        pageTitle: 'Sharing your project information publicly',
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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      publicRegisterSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
        heading: 'Sharing your project information publicly',
        pageTitle: 'Sharing your project information publicly',
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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      publicRegisterSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
        heading: 'Sharing your project information publicly',
        pageTitle: 'Sharing your project information publicly',
        projectName: 'Test Project',
        payload: { consent: 'invalid' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should show error messages without calling the back end when payload data is empty', async () => {
      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')

      const { result } = await makePostRequest({
        url: routes.PUBLIC_REGISTER,
        server: getServer(),
        formData: { consent: '' }
      })

      expect(apiPostMock).not.toHaveBeenCalled()

      const { document } = new JSDOM(result).window

      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    })

    test('Should show error for reason being empty when consent is set to no', async () => {
      const apiPostMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')

      const { result } = await makePostRequest({
        url: routes.PUBLIC_REGISTER,
        server: getServer(),
        formData: { consent: 'no' }
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
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        view: vi.fn()
      }

      const mockRequest = { payload: { consent: 'no', reason: 'Test reason' } }

      await publicRegisterSubmitController.handler(
        { payload: { consent: 'no', reason: 'Test reason' } },
        h
      )
      expect(cacheUtils.setExemptionCache).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Object),
        mockExemption
      )
    })
  })
})
