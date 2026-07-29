import { vi } from 'vitest'
import {
  UPLOAD_DRAWING_VIEW_ROUTE,
  uploadDrawingController
} from '#src/server/marine-licence/site-details/upload-drawing/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('uploadDrawingController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  it('renders the holding page for the given site and activity', () => {
    const request = createMockRequest({
      query: { site: '1', activity: '2' }
    })
    const h = createMockH()

    uploadDrawingController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(UPLOAD_DRAWING_VIEW_ROUTE, {
      pageTitle: 'Upload a construction drawing',
      heading: 'Upload a construction drawing',
      projectName: mockMarineLicenceApplication.projectName,
      siteNumber: 1,
      activityDetailsNumber: 2,
      backLink:
        '/marine-licence/review-site-details#activity-details-site-1-activity-2'
    })
  })
})
