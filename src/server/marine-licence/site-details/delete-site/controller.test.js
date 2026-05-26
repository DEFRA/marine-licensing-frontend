import { vi } from 'vitest'
import {
  DELETE_SITE_VIEW_ROUTE,
  deleteSiteController,
  deleteSiteSubmitController
} from '#src/server/marine-licence/site-details/delete-site/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'
import { mockManualCoordinatesMarineLicence } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const mockWithTwoSites = {
  ...mockManualCoordinatesMarineLicence,
  siteDetails: [
    { coordinatesType: 'coordinates', siteName: 'Site one' },
    { coordinatesType: 'coordinates', siteName: 'Site two' }
  ]
}

describe('deleteSiteController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
      mockWithTwoSites
    )
  })

  describe('GET handler', () => {
    it('should render the confirmation view with correct data', () => {
      const request = createMockRequest({ query: { site: '1' } })
      const h = createMockH()

      deleteSiteController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DELETE_SITE_VIEW_ROUTE, {
        pageTitle: 'Are you sure you want to delete this site?',
        heading: 'Are you sure you want to delete this site?',
        siteNumber: 1,
        siteIndex: 0,
        siteName: mockWithTwoSites.siteDetails[0].siteName,
        projectName: mockWithTwoSites.projectName,
        backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        marineLicenceRoutes
      })
    })

    it('should redirect to review site details when site is not found', () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        ...mockManualCoordinatesMarineLicence,
        siteDetails: []
      })
      const request = createMockRequest({ query: { site: '1' } })
      const h = createMockH()

      deleteSiteController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
      expect(h.view).not.toHaveBeenCalled()
    })
  })

  describe('POST handler', () => {
    it('should delete the site and redirect to review', async () => {
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const request = createMockRequest({ payload: { siteIndex: '0' } })
      const h = createMockH()

      await deleteSiteSubmitController.handler(request, h)

      const expectedSiteDetails = [mockWithTwoSites.siteDetails[1]]

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(
        request,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE_DETAILS,
        {
          id: mockWithTwoSites.id,
          siteDetails: expectedSiteDetails
        }
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
    })

    it('should redirect to task list when last site is deleted', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
        mockManualCoordinatesMarineLicence
      )
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const request = createMockRequest({ payload: { siteIndex: '0' } })
      const h = createMockH()

      await deleteSiteSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    it('should throw Boom.internal when API call fails', async () => {
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockRejectedValueOnce(new Error('API error'))

      const request = createMockRequest({ payload: { siteIndex: '0' } })
      const h = createMockH()

      await expect(
        deleteSiteSubmitController.handler(request, h)
      ).rejects.toThrow('Error deleting site')
    })
  })
})
