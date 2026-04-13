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
  })
})
