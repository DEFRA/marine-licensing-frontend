import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  specialLegalPowersController,
  specialLegalPowersSubmitController,
  SPECIAL_LEGAL_POWERS_VIEW_ROUTE
} from '#src/server/marine-licence/special-legal-powers/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#specialLegalPowers', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    specialLegalPowers: { agree: 'yes', details: 'Test reason' }
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockLicence.id,
        ...mockLicence.specialLegalPowers
      }
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
    authUtils.getUserSession.mockResolvedValue({
      userRelationshipType: 'EMPLOYEE'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#specialLegalPowersController', () => {
    test('specialLegalPowersController handler should render with correct context', async () => {
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

    test('specialLegalPowersController handler should redirect citizens to task list', async () => {
      authUtils.getUserSession.mockResolvedValueOnce({
        userRelationshipType: 'Citizen'
      })
      const h = {
        view: vi.fn(),
        redirect: vi.fn()
      }

      await specialLegalPowersController.handler({}, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
      expect(h.view).not.toHaveBeenCalled()
    })
  })

  describe('#specialLegalPowersSubmitController', () => {
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
        specialLegalPowersSubmitController.handler(
          { payload: { agree: 'yes', details: 'Test reason' }, query: {} },
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

      await specialLegalPowersSubmitController.handler(
        { payload: { agree: 'no' }, query: {} },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/special-legal-powers',
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

      await specialLegalPowersSubmitController.handler(
        {
          payload: { agree: 'yes', details: 'Test reason' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/special-legal-powers',
        {
          id: mockLicence.id,
          agree: 'yes',
          details: 'Test reason'
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
                    message: 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
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

      await specialLegalPowersSubmitController.handler(
        { payload: { agree: 'yes', details: 'Test reason' }, query: {} },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        SPECIAL_LEGAL_POWERS_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          payload: { agree: 'yes', details: 'Test reason' }
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
                    message: 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
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

      await specialLegalPowersSubmitController.handler(
        {
          payload: { agree: 'yes', details: 'Test reason' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        SPECIAL_LEGAL_POWERS_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
          payload: { agree: 'yes', details: 'Test reason' }
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

      specialLegalPowersSubmitController.options.validate.failAction(
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
            message: 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
            type: 'string.empty'
          }
        ]
      }

      specialLegalPowersSubmitController.options.validate.failAction(
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
