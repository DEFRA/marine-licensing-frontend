import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  publicRegisterNationalSecurityController,
  publicRegisterNationalSecuritySubmitController,
  PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE
} from '#src/server/marine-licence/public-register-national-security/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

const pageUrl =
  marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY

describe('#publicRegisterNationalSecurity', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    publicRegister: {
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity'
    }
  }

  const createH = () => ({
    redirect: vi.fn(),
    view: vi.fn().mockReturnValue({ takeover: vi.fn() })
  })

  const notNationalSecurity = [
    { withholdConsent: 'yes', withholdReason: 'commercialConfidentiality' },
    { withholdConsent: 'no' },
    undefined
  ]

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#publicRegisterNationalSecurityController', () => {
    test('renders an empty form with back and cancel links', () => {
      const h = createH()

      publicRegisterNationalSecurityController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE,
        {
          pageTitle: 'Withholding information for national security reasons',
          heading: 'Withholding information for national security reasons',
          projectName: 'Test Project',
          payload: { nationalSecurityApproval: undefined, reason: undefined },
          backLink: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        }
      )
    })

    test('renders saved answers', () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockLicence,
        publicRegister: {
          ...mockLicence.publicRegister,
          nationalSecurityApproval: 'yes',
          reason: 'Details'
        }
      })
      const h = createH()

      publicRegisterNationalSecurityController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE,
        expect.objectContaining({
          payload: { nationalSecurityApproval: 'yes', reason: 'Details' }
        })
      )
    })

    test('keeps the user within check your answers', () => {
      const h = createH()

      publicRegisterNationalSecurityController.handler(
        { query: { from: 'check-your-answers' } },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE,
        expect.objectContaining({
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER}?from=check-your-answers`,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
        })
      )
    })

    test.each(notNationalSecurity)(
      'redirects to the withholding information page when the reason is %o',
      (publicRegister) => {
        vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
          ...mockLicence,
          publicRegister
        })
        const h = createH()

        publicRegisterNationalSecurityController.handler(
          { query: { from: 'check-your-answers' } },
          h
        )

        expect(h.redirect).toHaveBeenCalledWith(
          `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER}?from=check-your-answers`
        )
        expect(h.view).not.toHaveBeenCalled()
      }
    )
  })

  describe('#publicRegisterNationalSecuritySubmitController', () => {
    test.each(notNationalSecurity)(
      'does not save and redirects to the withholding information page when the reason is %o',
      async (publicRegister) => {
        vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
          ...mockLicence,
          publicRegister
        })
        const h = createH()

        await publicRegisterNationalSecuritySubmitController.handler(
          { payload: { nationalSecurityApproval: 'no' }, query: {} },
          h
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
        )
        expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
        expect(cacheUtils.setMarineLicenceCache).not.toHaveBeenCalled()
      }
    )

    test('saves an approval with a reason and reloads the page', async () => {
      const h = createH()

      await publicRegisterNationalSecuritySubmitController.handler(
        {
          payload: { nationalSecurityApproval: 'yes', reason: 'Details' },
          query: {}
        },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register/national-security',
        { id: 'test-id', nationalSecurityApproval: 'yes', reason: 'Details' }
      )
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        expect.objectContaining({
          publicRegister: {
            withholdConsent: 'yes',
            withholdReason: 'nationalSecurity',
            nationalSecurityApproval: 'yes',
            reason: 'Details'
          }
        })
      )
      expect(h.redirect).toHaveBeenCalledWith(pageUrl)
    })

    test('drops a saved reason when the answer is No', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockLicence,
        publicRegister: {
          ...mockLicence.publicRegister,
          nationalSecurityApproval: 'yes',
          reason: 'Details'
        }
      })
      const h = createH()

      await publicRegisterNationalSecuritySubmitController.handler(
        { payload: { nationalSecurityApproval: 'no' }, query: {} },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register/national-security',
        { id: 'test-id', nationalSecurityApproval: 'no' }
      )
      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        expect.objectContaining({
          publicRegister: {
            withholdConsent: 'yes',
            withholdReason: 'nationalSecurity',
            nationalSecurityApproval: 'no'
          }
        })
      )
    })

    test('keeps the check your answers query on the redirect', async () => {
      const h = createH()

      await publicRegisterNationalSecuritySubmitController.handler(
        {
          payload: { nationalSecurityApproval: 'no' },
          query: { from: 'check-your-answers' }
        },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        `${pageUrl}?from=check-your-answers`
      )
    })

    test('passes errors without validation data to the global handler', async () => {
      const thrownError = { res: { statusCode: 500 }, data: {} }
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        thrownError
      )
      const h = createH()

      await expect(
        publicRegisterNationalSecuritySubmitController.handler(
          { payload: { nationalSecurityApproval: 'no' }, query: {} },
          h
        )
      ).rejects.toBe(thrownError)
      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('shows API validation errors against the field', async () => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        {
          data: {
            payload: {
              validation: {
                details: [
                  {
                    field: 'reason',
                    message:
                      'PUBLIC_REGISTER_NATIONAL_SECURITY_REASON_MAX_LENGTH',
                    type: 'string.max'
                  }
                ]
              }
            }
          }
        }
      )
      const h = createH()
      const payload = { nationalSecurityApproval: 'yes', reason: 'Details' }

      await publicRegisterNationalSecuritySubmitController.handler(
        { payload, query: {} },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE,
        expect.objectContaining({
          payload,
          backLink: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          errors: {
            reason: expect.objectContaining({
              text: 'Details of what you want withheld must be 1000 characters or fewer'
            })
          }
        })
      )
      expect(cacheUtils.setMarineLicenceCache).not.toHaveBeenCalled()
    })

    test('failAction re-renders with errors, back and cancel links', () => {
      const h = createH()
      const request = {
        payload: { nationalSecurityApproval: 'yes', reason: '' },
        query: {}
      }
      const err = {
        details: [
          {
            path: ['reason'],
            message: 'PUBLIC_REGISTER_NATIONAL_SECURITY_REASON_REQUIRED',
            type: 'string.empty'
          }
        ]
      }

      publicRegisterNationalSecuritySubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE,
        expect.objectContaining({
          payload: request.payload,
          projectName: 'Test Project',
          backLink: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          errorSummary: [
            {
              href: '#reason',
              text: 'Enter details of what you want withheld',
              field: ['reason']
            }
          ]
        })
      )
    })
  })
})
