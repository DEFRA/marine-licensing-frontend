import { siteNoticeResubmitPhotoUploadAndWaitController } from '#src/server/marine-licence/site-notice/resubmit/photo-upload-and-wait/controller.js'
import { PHOTO_UPLOAD_SESSION_KEY } from '#src/server/marine-licence/site-notice/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  mockMarineLicenceWithResubmissionTask,
  mockResubmissionTaskId
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/cdp-upload-service/index.js')

const marineLicenceId = mockMarineLicenceWithResubmissionTask.id
const taskUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/${marineLicenceId}/${mockResubmissionTaskId}`
const uploadPageUrl = '/upload-page'
const session = {
  uploadId: 'upload-id',
  statusUrl: 'status-url',
  field: 'closeUpPhoto',
  uploadPageUrl
}
const readyStatus = {
  status: 'ready',
  filename: 'notice.png',
  s3Location: {
    s3Key: 'key',
    checksumSha256: 'sum',
    detectedContentType: 'image/png'
  }
}

describe('#siteNoticeResubmitPhotoUploadAndWaitController', () => {
  let getStatus

  const runWait = async (status, requestSession = session) => {
    getStatus.mockResolvedValue(status)
    const request = createMockRequest({
      marineLicence: mockMarineLicenceWithResubmissionTask,
      params: { marineLicenceId, taskId: mockResubmissionTaskId },
      query: { location: '3' },
      yar: { get: vi.fn(() => requestSession), set: vi.fn(), commit: vi.fn() }
    })
    const h = createMockH()
    await siteNoticeResubmitPhotoUploadAndWaitController.handler(request, h)
    return { request, h }
  }

  beforeEach(() => {
    getStatus = vi.fn()
    vi.mocked(getCdpUploadService).mockReturnValue({ getStatus })
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
  })

  test('returns to the task page when there is no upload session', async () => {
    const { h } = await runWait({}, {})

    expect(getStatus).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(taskUrl)
  })

  test('saves the photo against the rejected location and returns to the task page', async () => {
    const { request, h } = await runWait(readyStatus)

    expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
      request,
      apiRoutes.UPDATE_SITE_NOTICE_RESUBMISSION,
      {
        id: marineLicenceId,
        taskId: mockResubmissionTaskId,
        locationNumber: 3,
        closeUpPhoto: {
          uploadedFile: { filename: 'notice.png' },
          s3Location: expect.objectContaining({
            s3Key: 'key',
            checksumSha256: 'sum'
          })
        }
      }
    )
    expect(request.yar.set).toHaveBeenCalledWith(PHOTO_UPLOAD_SESSION_KEY, {})
    expect(h.redirect).toHaveBeenCalledWith(taskUrl)
  })
})
