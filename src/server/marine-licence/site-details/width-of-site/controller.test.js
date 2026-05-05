import { vi } from 'vitest'
import {
  widthOfSiteController,
  widthOfSiteSubmitController
} from '#src/server/marine-licence/site-details/width-of-site/controller.js'
import { WIDTH_OF_SITE_VIEW_ROUTE } from '#src/server/common/validation/width-of-site/constants.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/helpers/marine-licence/save-site-details.js')

describe('#widthOfSite (marine licence)', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#widthOfSiteController', () => {
    test('handler should render with correct context with pre-populated width', () => {
      const h = { view: vi.fn() }

      widthOfSiteController.handler(
        createMockRequest({
          site: {
            siteIndex: 0,
            siteNumber: 1,
            queryParams: '',
            siteDetails: { circleWidth: '500' }
          }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
        cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
        projectName: 'Test Project',
        siteNumber: 1,
        action: undefined,
        payload: { width: '500' }
      })
    })

    test('handler should render with payload.width undefined when no circleWidth in cache', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        projectName: mockMarineLicenceApplication.projectName
      })
      const h = { view: vi.fn() }

      widthOfSiteController.handler(
        createMockRequest({
          site: {
            siteIndex: 0,
            siteNumber: 1,
            queryParams: '',
            siteDetails: {}
          }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
        cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
        projectName: 'Test Project',
        siteNumber: 1,
        action: undefined,
        payload: { width: undefined }
      })
    })
  })

  describe('#widthOfSiteSubmitController', () => {
    test('should call updateMarineLicenceSiteDetails with trimmed width and redirect to same page', async () => {
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { width: ' 500 ' },
        site: { siteIndex: 0, siteNumber: 1, queryParams: '', siteDetails: {} }
      })

      await widthOfSiteSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'circleWidth',
        '500'
      )
      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(request, h)
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE
      )
    })
  })
})
