import { siteNoticePhotoUploadAndWaitController } from '#src/server/marine-licence/site-notice/photo-upload-and-wait/controller.js'
import {
  PHOTO_FILE_SIZE_ERROR_MESSAGE,
  PHOTO_FILE_TYPE_ERROR_MESSAGE,
  PHOTO_UPLOAD_SESSION_KEY
} from '#src/server/marine-licence/site-notice/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { mockMarineLicenceWithApplicationTask } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { UPLOAD_AND_WAIT_VIEW_ROUTE } from '#src/server/common/helpers/file-upload/constants.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/cdp-upload-service/index.js')

const marineLicenceId = mockMarineLicenceWithApplicationTask.id
const uploadPageUrl = '/upload-page'
const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
const session = {
  uploadId: 'upload-id',
  statusUrl: 'status-url',
  field: 'positionPhoto',
  uploadPageUrl
}

describe('#siteNoticePhotoUploadAndWaitController', () => {
  let getStatus

  const runWait = async (
    status,
    requestSession = session,
    marineLicence = mockMarineLicenceWithApplicationTask
  ) => {
    getStatus.mockResolvedValue(status)
    const request = createMockRequest({
      marineLicence,
      params: { marineLicenceId },
      query: { location: '2' },
      yar: { get: vi.fn(() => requestSession), set: vi.fn(), commit: vi.fn() }
    })
    const h = createMockH()
    await siteNoticePhotoUploadAndWaitController.handler(request, h)
    return { request, h }
  }

  const expectUploadError = ({ request, h }, message) => {
    expect(request.yar.set).toHaveBeenCalledWith(PHOTO_UPLOAD_SESSION_KEY, {
      uploadError: { message, fieldName: 'file' }
    })
    expect(h.redirect).toHaveBeenCalledWith(uploadPageUrl)
  }

  beforeEach(() => {
    getStatus = vi.fn()
    vi.mocked(getCdpUploadService).mockReturnValue({ getStatus })
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
  })

  test('redirects to view details when there is no site notice task', async () => {
    const { h } = await runWait({}, session, {
      ...mockMarineLicenceWithApplicationTask,
      applicationTasks: []
    })

    expect(getStatus).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
    )
  })

  test('redirects to the site notice page when there is no upload session', async () => {
    const { h } = await runWait({}, {})

    expect(getStatus).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(displayUrl)
  })

  test('shows the waiting page while the file is scanned', async () => {
    const { h } = await runWait({ status: 'scanning', filename: 'a.jpg' })

    expect(h.view).toHaveBeenCalledWith(
      UPLOAD_AND_WAIT_VIEW_ROUTE,
      expect.objectContaining({
        projectName: 'Test Project',
        isProcessing: true,
        filename: 'a.jpg',
        tryAgainLink: uploadPageUrl,
        cancelLink: displayUrl
      })
    )
  })

  test('saves a ready photo against the field stored in the session', async () => {
    const { request, h } = await runWait({
      status: 'ready',
      filename: 'notice.jpg',
      s3Location: {
        s3Key: 'key',
        checksumSha256: 'sum',
        detectedContentType: 'image/jpeg'
      }
    })

    expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
      request,
      apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE,
      {
        positionPhoto: {
          uploadedFile: { filename: 'notice.jpg' },
          s3Location: expect.objectContaining({
            s3Key: 'key',
            checksumSha256: 'sum'
          })
        },
        id: marineLicenceId,
        evidenceIndex: 1
      }
    )
    expect(request.yar.set).toHaveBeenCalledWith(PHOTO_UPLOAD_SESSION_KEY, {})
    expect(h.redirect).toHaveBeenCalledWith(displayUrl)
  })

  test('rejects a file that is not a JPG or PNG', async () => {
    const result = await runWait({
      status: 'ready',
      filename: 'notice.pdf',
      s3Location: { detectedContentType: 'application/pdf' }
    })

    expect(authRequests.authenticatedPatchRequest).not.toHaveBeenCalled()
    expectUploadError(result, PHOTO_FILE_TYPE_ERROR_MESSAGE)
  })

  test('shows the file type error when the API rejects the media type', async () => {
    vi.mocked(authRequests.authenticatedPatchRequest).mockRejectedValue({
      output: { statusCode: statusCodes.unsupportedMediaType }
    })

    const result = await runWait({
      status: 'ready',
      filename: 'notice.png',
      s3Location: { detectedContentType: 'image/png' }
    })

    expectUploadError(result, PHOTO_FILE_TYPE_ERROR_MESSAGE)
  })

  test.each([
    ['FILE_TOO_LARGE', PHOTO_FILE_SIZE_ERROR_MESSAGE],
    ['INVALID_FILE_TYPE', PHOTO_FILE_TYPE_ERROR_MESSAGE],
    ['VIRUS_DETECTED', 'The selected file contains a virus']
  ])('maps the %s rejection to its message', async (errorCode, message) => {
    const result = await runWait({ status: 'rejected', errorCode })

    expectUploadError(result, message)
  })

  test('clears the session and returns to the upload page when the status check fails', async () => {
    getStatus.mockRejectedValue(new Error('CDP down'))
    const request = createMockRequest({
      marineLicence: mockMarineLicenceWithApplicationTask,
      params: { marineLicenceId },
      query: { location: '2' },
      yar: { get: vi.fn(() => session), set: vi.fn(), commit: vi.fn() }
    })
    const h = createMockH()

    await siteNoticePhotoUploadAndWaitController.handler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith(PHOTO_UPLOAD_SESSION_KEY, {})
    expect(h.redirect).toHaveBeenCalledWith(uploadPageUrl)
  })
})
