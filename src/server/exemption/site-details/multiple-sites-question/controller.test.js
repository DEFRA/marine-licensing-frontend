import {
  multipleSitesController,
  multipleSitesSubmitController,
  MULTIPLE_SITES_VIEW_ROUTE,
  errorMessages
} from '~/src/server/exemption/site-details/multiple-sites-question/controller.js'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#multipleSitesQuestion', () => {
  jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
  jest.mocked(setExemptionCache).mockReturnValue({})

  describe('#multipleSitesController', () => {
    test('should render with correct context and call utils function', () => {
      const mockMultipleSiteDetails = { multipleSitesEnabled: true }
      jest.mocked(getExemptionCache).mockReturnValueOnce({
        ...mockExemption,
        multipleSiteDetails: mockMultipleSiteDetails
      })

      const h = { view: jest.fn() }

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
    test('should redirect to coordinates entry choice when "no" is selected', () => {
      const request = {
        payload: { multipleSitesEnabled: 'no' }
      }
      const h = { redirect: jest.fn() }

      multipleSitesSubmitController.handler(request, h)

      expect(jest.mocked(setExemptionCache)).toHaveBeenCalledWith(request, {
        ...mockExemption,
        multipleSiteDetails: { multipleSitesEnabled: false }
      })
      expect(h.redirect).toHaveBeenCalledWith(routes.COORDINATES_ENTRY_CHOICE)
    })

    test('should redirect to site name when "yes" is selected', () => {
      const request = {
        payload: { multipleSitesEnabled: 'yes' }
      }
      const h = { redirect: jest.fn() }

      multipleSitesSubmitController.handler(request, h)

      expect(jest.mocked(setExemptionCache)).toHaveBeenCalledWith(request, {
        ...mockExemption,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })
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
      const h = { view: jest.fn().mockReturnValue({ takeover: jest.fn() }) }

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
    })

    test('should handle validation failure without error details', () => {
      const request = {
        payload: { multipleSites: 'invalid' }
      }
      const h = { view: jest.fn().mockReturnValue({ takeover: jest.fn() }) }

      multipleSitesSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(MULTIPLE_SITES_VIEW_ROUTE, {
        pageTitle: 'Do you need to tell us about more than one site?',
        heading: 'Do you need to tell us about more than one site?',
        backLink: routes.COORDINATES_TYPE_CHOICE,
        payload: { multipleSites: 'invalid' },
        projectName: 'Test Project'
      })
    })
  })
})
