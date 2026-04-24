import { vi } from 'vitest'
import {
  widthOfSiteController,
  widthOfSiteSubmitController,
  widthOfSiteSubmitFailHandler
} from '#src/server/marine-licence/site-details/width-of-site/controller.js'
import { WIDTH_OF_SITE_VIEW_ROUTE } from '#src/server/common/validation/width-of-site/constants.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

const mockApplicationWithWidth = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      ...mockMarineLicenceApplication.siteDetails[0],
      circleWidth: '500'
    }
  ]
}

describe('#widthOfSite (marine licence)', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(mockApplicationWithWidth)
  })

  describe('#widthOfSiteController', () => {
    test('handler should render with correct context with pre-populated width', () => {
      const h = { view: vi.fn() }

      widthOfSiteController.handler(createMockRequest(), h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        projectName: 'Test Project',
        siteNumber: null,
        action: undefined,
        payload: { width: '500' }
      })
    })

    test('handler should render with payload.width undefined when no circleWidth in cache', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        projectName: mockMarineLicenceApplication.projectName,
        siteDetails: []
      })
      const h = { view: vi.fn() }

      widthOfSiteController.handler(createMockRequest(), h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        projectName: 'Test Project',
        siteNumber: null,
        action: undefined,
        payload: { width: undefined }
      })
    })
  })

  describe('#widthOfSiteSubmitFailHandler', () => {
    test('should correctly format error data', () => {
      const request = createMockRequest({
        payload: { width: 'invalid' }
      })
      const h = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }
      const err = {
        details: [{ path: ['width'], message: 'TEST', type: 'any.only' }]
      }

      widthOfSiteSubmitFailHandler(request, h, err)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        projectName: 'Test Project',
        payload: { width: 'invalid' },
        siteNumber: null,
        action: undefined,
        errorSummary: [{ href: '#width', text: 'TEST', field: ['width'] }],
        errors: {
          width: { field: ['width'], href: '#width', text: 'TEST' }
        }
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should still render page if no error details are provided', () => {
      const request = createMockRequest({
        payload: { width: 'invalid' }
      })
      const h = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }

      widthOfSiteSubmitFailHandler(request, h, {})

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        projectName: 'Test Project',
        payload: { width: 'invalid' },
        siteNumber: null,
        action: undefined
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })
  })

  describe('#widthOfSiteSubmitController', () => {
    test('should call updateMarineLicenceSiteDetails with trimmed width and redirect to same page', async () => {
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { width: ' 500 ' }
      })

      await widthOfSiteSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'circleWidth',
        '500'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE
      )
    })

    test('should not trim a width with no surrounding spaces', async () => {
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { width: '250' }
      })

      await widthOfSiteSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'circleWidth',
        '250'
      )
    })
  })
})
