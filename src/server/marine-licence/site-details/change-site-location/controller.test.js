import { vi } from 'vitest'
import {
  CHANGE_SITE_LOCATION_VIEW_ROUTE,
  changeSiteLocationController,
  changeSiteLocationSubmitController
} from '#src/server/marine-licence/site-details/change-site-location/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('changeSiteLocationController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('GET handler', () => {
    it('should render the change site location view with correct data', () => {
      const request = createMockRequest({
        query: { site: '1' }
      })
      const h = createMockH()

      changeSiteLocationController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CHANGE_SITE_LOCATION_VIEW_ROUTE, {
        pageTitle: 'Change site location',
        heading: 'Change site location',
        siteNumber: 1,
        siteIndex: 0,
        siteName: 'test site name',
        projectName: mockMarineLicenceApplication.projectName,
        backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      })
    })
  })

  describe('POST handler', () => {
    it('should set singleSiteMode with siteIndex and redirect to choose file upload type', async () => {
      vi.mocked(cacheUtils.setSingleSiteMode).mockResolvedValue()

      const request = createMockRequest({ payload: { siteIndex: '0' } })
      const h = createMockH()

      await changeSiteLocationSubmitController.handler(request, h)

      expect(cacheUtils.setSingleSiteMode).toHaveBeenCalledWith(request, h, 0)
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
      )
    })
  })
})
