import { vi } from 'vitest'
import {
  DELETE_CONSTRUCTION_DRAWING_VIEW_ROUTE,
  deleteConstructionDrawingController,
  deleteConstructionDrawingSubmitController
} from '#src/server/marine-licence/site-details/delete-construction-drawing/controller.js'
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
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const mockLicenceWithTwoDrawings = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      ...mockMarineLicenceApplication.siteDetails[0],
      constructionDrawings: [
        {
          filename: 'drawing-one.pdf',
          s3Location: { s3Bucket: 'b', s3Key: 'k1', checksumSha256: 'c1' }
        },
        {
          filename: 'drawing-two.pdf',
          s3Location: { s3Bucket: 'b', s3Key: 'k2', checksumSha256: 'c2' }
        }
      ]
    }
  ]
}

describe('deleteConstructionDrawingController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
      mockLicenceWithTwoDrawings
    )
  })

  describe('GET handler', () => {
    it('redirects to review site details when attempting to delete the first drawing', () => {
      const request = createMockRequest({
        query: { site: '1', drawing: '1' }
      })
      const h = createMockH()

      deleteConstructionDrawingController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    it('renders the confirmation view for a deletable drawing', () => {
      const request = createMockRequest({
        query: { site: '1', drawing: '2' }
      })
      const h = createMockH()

      deleteConstructionDrawingController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        DELETE_CONSTRUCTION_DRAWING_VIEW_ROUTE,
        {
          pageTitle:
            'Are you sure you want to delete Site 1 construction drawing 2?',
          heading:
            'Are you sure you want to delete Site 1 construction drawing 2?',
          siteNumber: 1,
          siteIndex: 0,
          drawingIndex: 1,
          drawingNumber: 2,
          projectName: mockMarineLicenceApplication.projectName,
          backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
          marineLicenceRoutes
        }
      )
    })
  })

  describe('POST handler', () => {
    it('calls authenticatedPatchRequest with the correct payload and redirects to review', async () => {
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const request = createMockRequest({
        payload: { siteIndex: '0', drawingIndex: '1' }
      })
      const h = createMockH()

      await deleteConstructionDrawingSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(request, apiRoutes.DELETE_CONSTRUCTION_DRAWING, {
        id: mockMarineLicenceApplication.id,
        siteIndex: 0,
        drawingIndex: 1
      })

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
    })

    it('throws when the API call fails', async () => {
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockRejectedValueOnce(new Error('API error'))

      const request = createMockRequest({
        payload: { siteIndex: '0', drawingIndex: '1' }
      })
      const h = createMockH()

      await expect(
        deleteConstructionDrawingSubmitController.handler(request, h)
      ).rejects.toThrow('Error deleting construction drawing')
    })
  })
})
