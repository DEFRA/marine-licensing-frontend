import { vi } from 'vitest'
import {
  multipleSitesController,
  multipleSitesSubmitController,
  MULTIPLE_SITES_VIEW_ROUTE,
  errorMessages
} from '#src/server/exemption/site-details/multiple-sites-question/controller.js'
import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')

describe('#multipleSitesQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getExemptionCache).mockReturnValue(mockExemption)
    vi.mocked(setExemptionCache).mockReturnValue({})
  })

  describe('#multipleSitesController', () => {
    test('should render with correct context and call utils function', () => {
      const mockMultipleSiteDetails = { multipleSitesEnabled: true }
      vi.mocked(getExemptionCache).mockReturnValueOnce({
        ...mockExemption,
        multipleSiteDetails: mockMultipleSiteDetails
      })

      const h = { view: vi.fn() }

      multipleSitesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(MULTIPLE_SITES_VIEW_ROUTE, {
        pageTitle: 'Do you need to tell us about more than one site?',
        heading: 'Do you need to tell us about more than one site?',
        backLink: routes.COORDINATES_TYPE_CHOICE,
        payload: { multipleSitesEnabled: 'yes' },
        projectName: 'Test Project'
      })
    })
  })

  describe('#multipleSitesSubmitController', () => {
    test('should redirect to coordinates entry choice when "no" is selected', async () => {
      const request = {
        payload: { multipleSitesEnabled: 'no' }
      }
      const h = { redirect: vi.fn() }

      await multipleSitesSubmitController.handler(request, h)

      expect(vi.mocked(setExemptionCache)).toHaveBeenCalledWith(request, h, {
        ...mockExemption,
        multipleSiteDetails: { multipleSitesEnabled: false }
      })

      expect(h.redirect).toHaveBeenCalledWith(routes.ACTIVITY_DATES)
    })

    test('should redirect to site name when "yes" is selected', async () => {
      const request = {
        payload: { multipleSitesEnabled: 'yes' }
      }
      const h = { redirect: vi.fn() }

      await multipleSitesSubmitController.handler(request, h)

      expect(vi.mocked(setExemptionCache)).toHaveBeenCalledWith(
        request,
        h,
        expect.objectContaining({
          multipleSiteDetails: { multipleSitesEnabled: true }
        })
      )
      expect(h.redirect).toHaveBeenCalledWith(routes.SITE_NAME)
    })

    test('should validate payload correctly', () => {
      const validationSchema =
        multipleSitesSubmitController.options.validate.payload

      expect(
        validationSchema.validate({ multipleSitesEnabled: 'yes' }).error
      ).toBeUndefined()
      expect(
        validationSchema.validate({ multipleSitesEnabled: 'no' }).error
      ).toBeUndefined()

      expect(validationSchema.validate({}).error).toBeDefined()
      expect(
        validationSchema.validate({ multipleSitesEnabled: '' }).error
      ).toBeDefined()
      expect(
        validationSchema.validate({ multipleSitesEnabled: 'maybe' }).error
      ).toBeDefined()
      expect(
        validationSchema.validate({ multipleSitesEnabled: 'YES' }).error
      ).toBeDefined()
    })

    test('should have correct error messages', () => {
      expect(errorMessages.MULTIPLE_SITES_REQUIRED).toBe(
        'Select whether you need to tell us about more than one site'
      )
    })

    test('should handle validation failure with error details', () => {
      const request = {
        payload: { multipleSites: 'invalid' }
      }
      const mockTakeover = vi.fn()
      const h = { view: vi.fn().mockReturnValue({ takeover: mockTakeover }) }

      const err = {
        details: [
          {
            message: 'MULTIPLE_SITES_REQUIRED',
            field: ['multipleSitesEnabled']
          }
        ]
      }

      multipleSitesSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(MULTIPLE_SITES_VIEW_ROUTE, {
        pageTitle: 'Do you need to tell us about more than one site?',
        heading: 'Do you need to tell us about more than one site?',
        backLink: routes.COORDINATES_TYPE_CHOICE,
        payload: { multipleSites: 'invalid' },
        projectName: 'Test Project',
        errors: expect.any(Object),
        errorSummary: expect.any(Array)
      })
      expect(mockTakeover).toHaveBeenCalled()
    })

    test('should handle validation failure without error details', () => {
      const request = {
        payload: { multipleSites: 'invalid' }
      }
      const mockTakeover = vi.fn()
      const h = { view: vi.fn().mockReturnValue({ takeover: mockTakeover }) }

      multipleSitesSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(MULTIPLE_SITES_VIEW_ROUTE, {
        pageTitle: 'Do you need to tell us about more than one site?',
        heading: 'Do you need to tell us about more than one site?',
        backLink: routes.COORDINATES_TYPE_CHOICE,
        payload: { multipleSites: 'invalid' },
        projectName: 'Test Project'
      })
      expect(mockTakeover).toHaveBeenCalled()
    })
  })
})
