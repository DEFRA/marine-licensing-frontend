import { vi } from 'vitest'
import {
  deleteAllSitesController,
  deleteAllSitesSubmitController
} from './controller.js'
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

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')

describe('deleteAllSitesController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
      mockManualCoordinatesMarineLicence
    )
  })

  describe('GET handler', () => {
    it('should render delete all sites view with correct data', () => {
      const request = createMockRequest()
      const h = createMockH()

      deleteAllSitesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith('templates/delete-all-sites', {
        pageTitle: 'Are you sure you want to delete all site details?',
        heading: 'Are you sure you want to delete all site details?',
        backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        projectName: mockManualCoordinatesMarineLicence.projectName
      })
    })

    it('should redirect to task list when no sites exist', () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        ...mockManualCoordinatesMarineLicence,
        siteDetails: []
      })

      const request = createMockRequest()
      const h = createMockH()

      deleteAllSitesController.handler(request, h)

      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    it('should redirect to task list when siteDetails is null', () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        ...mockManualCoordinatesMarineLicence,
        siteDetails: null
      })

      const request = createMockRequest()
      const h = createMockH()

      deleteAllSitesController.handler(request, h)

      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })
  })

  describe('POST handler', () => {
    beforeEach(() => {
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})
      vi.mocked(cacheUtils.setMarineLicenceCache).mockResolvedValue({})
    })

    it('should patch backend with empty siteDetails and redirect to task list', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await deleteAllSitesSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(
        request,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE_DETAILS,
        {
          id: mockManualCoordinatesMarineLicence.id,
          siteDetails: []
        }
      )

      expect(vi.mocked(cacheUtils.setMarineLicenceCache)).toHaveBeenCalledWith(
        request,
        h,
        {
          id: mockManualCoordinatesMarineLicence.id,
          siteDetails: []
        }
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    it('should redirect to task list without patching when no sites exist', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        ...mockManualCoordinatesMarineLicence,
        siteDetails: []
      })

      const request = createMockRequest()
      const h = createMockH()

      await deleteAllSitesSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    it('should redirect to task list without patching when siteDetails is null', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        ...mockManualCoordinatesMarineLicence,
        siteDetails: null
      })

      const request = createMockRequest()
      const h = createMockH()

      await deleteAllSitesSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    it('should log error and redirect to review site details on API failure', async () => {
      const testError = new Error('API error')
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockRejectedValueOnce(testError)

      const request = createMockRequest()
      const h = createMockH()

      await deleteAllSitesSubmitController.handler(request, h)

      expect(request.logger.error).toHaveBeenCalledWith(
        {
          err: testError,
          event: {
            action: 'marine-licence:delete-all-sites-failed',
            reference: mockManualCoordinatesMarineLicence.id
          }
        },
        'Error deleting all sites'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
    })
  })
})
