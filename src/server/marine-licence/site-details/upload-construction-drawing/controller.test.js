import { vi } from 'vitest'
import {
  UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE,
  uploadConstructionDrawingController
} from '#src/server/marine-licence/site-details/upload-construction-drawing/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as cdpUploadService from '#src/services/cdp-upload-service/index.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')

describe('uploadConstructionDrawingController', () => {
  const mockUploadConfig = {
    uploadId: 'test-upload-id',
    uploadUrl: 'https://upload.example.com',
    statusUrl: 'https://status.example.com',
    maxFileSize: 10 * 1024 * 1024
  }

  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue({
      initiate: vi.fn().mockResolvedValue(mockUploadConfig)
    })
  })

  it('renders the upload screen for the given site and drawing', async () => {
    const request = createMockRequest({
      query: { site: '1', drawing: '1' }
    })
    const h = createMockH()

    await uploadConstructionDrawingController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE,
      expect.objectContaining({
        pageTitle: 'Site 1: Upload construction drawing 1',
        heading: 'Site 1: Upload construction drawing 1',
        projectName: mockMarineLicenceApplication.projectName,
        siteNumber: 1,
        drawingNumber: 1,
        uploadUrl: mockUploadConfig.uploadUrl,
        acceptAttribute: '.pdf,.bmp,.gif,.jpg,.jpeg,.png,.tif',
        backLink:
          '/marine-licence/review-site-details#construction-drawing-site-1-1',
        cancelLink:
          '/marine-licence/review-site-details#construction-drawing-site-1-1'
      })
    )
  })

  it('initiates a CDP upload constrained to 10MB', async () => {
    const initiate = vi.fn().mockResolvedValue(mockUploadConfig)
    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue({
      initiate
    })

    const request = createMockRequest({
      query: { site: '1', drawing: '2' }
    })
    const h = createMockH()

    await uploadConstructionDrawingController.handler(request, h)

    expect(initiate).toHaveBeenCalledWith(
      expect.objectContaining({
        maxFileSize: 10 * 1024 * 1024,
        s3Path: 'marine-licence/construction-drawings'
      })
    )
  })

  it('stores the upload config against the site, keyed by drawing index', async () => {
    const request = createMockRequest({
      query: { site: '1', drawing: '2' }
    })
    const h = createMockH()

    await uploadConstructionDrawingController.handler(request, h)

    expect(cacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      'uploadConfig',
      expect.objectContaining({
        fileType: 'construction-drawing',
        siteIndex: 0,
        drawingIndex: 1
      })
    )
  })

  it('displays an error and clears it from the session when one is present', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          uploadError: {
            message: 'The selected file contains a virus',
            fieldName: 'file'
          }
        }
      ]
    })

    const request = createMockRequest({
      query: { site: '1', drawing: '1' }
    })
    const h = createMockH()

    await uploadConstructionDrawingController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE,
      expect.objectContaining({
        errorSummary: [
          expect.objectContaining({
            text: 'The selected file contains a virus'
          })
        ]
      })
    )
    expect(cacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      'uploadError',
      null
    )
  })
})
