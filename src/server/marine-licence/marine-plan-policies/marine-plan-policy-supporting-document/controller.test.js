import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import {
  MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE,
  marinePlanPolicySupportingDocumentController,
  marinePlanPolicySupportingDocumentUploadAndWaitController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/controller.js'
import {
  DOCUMENT_FILE_SIZE_ERROR_MESSAGE,
  DOCUMENT_FILE_TYPE_ERROR_MESSAGE,
  DOCUMENT_UPLOAD_SESSION_KEY
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/constants.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { UPLOAD_AND_WAIT_VIEW_ROUTE } from '#src/server/common/helpers/file-upload/constants.js'
import { DEFAULT_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/cdp-upload-service/index.js')

const marineLicence = { id: 'lic-1', projectName: 'Test Project' }
const uploadPageUrl = '/upload-page'
const documentId = 'c7e4ef70-7c7d-4464-8401-7bf4e6f47351'
const policiesUrl = marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
const session = {
  uploadId: 'upload-id',
  statusUrl: 'status-url',
  uploadPageUrl
}

describe('#marinePlanPolicySupportingDocumentUploadAndWaitController', () => {
  let getStatus

  const runWait = async (status, requestSession = session) => {
    getStatus.mockResolvedValue(status)
    const request = createMockRequest({
      yar: { get: vi.fn(() => requestSession), set: vi.fn(), commit: vi.fn() }
    })
    const h = createMockH()
    await marinePlanPolicySupportingDocumentUploadAndWaitController.handler(
      request,
      h
    )
    return { request, h }
  }

  const expectUploadError = ({ request, h }, message) => {
    expect(request.yar.set).toHaveBeenCalledWith(DOCUMENT_UPLOAD_SESSION_KEY, {
      uploadError: { message, fieldName: 'file' }
    })
    expect(h.redirect).toHaveBeenCalledWith(uploadPageUrl)
  }

  beforeEach(() => {
    getStatus = vi.fn()
    vi.mocked(getCdpUploadService).mockReturnValue({ getStatus })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(marineLicence)
    vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({})
  })

  test('redirects to the marine plan policies page when there is no upload session', async () => {
    const { h } = await runWait({}, {})

    expect(getStatus).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(policiesUrl)
  })

  test('shows the waiting page while the file is scanned', async () => {
    const { h } = await runWait({ status: 'scanning', filename: 'a.pdf' })

    expect(h.view).toHaveBeenCalledWith(
      UPLOAD_AND_WAIT_VIEW_ROUTE,
      expect.objectContaining({
        projectName: 'Test Project',
        isProcessing: true,
        filename: 'a.pdf',
        tryAgainLink: uploadPageUrl,
        cancelLink: policiesUrl
      })
    )
  })

  test('saves a ready document and redirects to the document type page with the documentId', async () => {
    vi.mocked(authRequests.authenticatedPostRequest).mockResolvedValue({
      payload: { value: { documentId } }
    })

    const { request, h } = await runWait({
      status: 'ready',
      filename: 'notice.pdf',
      s3Location: {
        s3Key: 'key',
        checksumSha256: 'sum',
        detectedContentType: 'application/pdf'
      }
    })

    expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
      request,
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT,
      expect.objectContaining({
        id: marineLicence.id,
        uploadedFile: { filename: 'notice.pdf' },
        s3Location: expect.objectContaining({
          s3Key: 'key',
          checksumSha256: 'sum'
        })
      })
    )
    expect(request.yar.set).toHaveBeenCalledWith(
      DOCUMENT_UPLOAD_SESSION_KEY,
      {}
    )
    expect(h.redirect).toHaveBeenCalledWith(
      `/marine-licence/marine-plan-policy/supporting-document-type/${documentId}`
    )
  })

  test.each([
    ['not a PDF or document', { detectedContentType: 'application/x-rar' }],
    ['of unknown type', {}]
  ])('rejects a file that is %s', async (_, s3Location) => {
    const result = await runWait({
      status: 'ready',
      filename: 'notice.rar',
      s3Location
    })

    expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
    expectUploadError(result, DOCUMENT_FILE_TYPE_ERROR_MESSAGE)
  })

  test('shows the file type error when the API rejects the media type', async () => {
    vi.mocked(authRequests.authenticatedPostRequest).mockRejectedValue({
      output: { statusCode: statusCodes.unsupportedMediaType }
    })

    const result = await runWait({
      status: 'ready',
      filename: 'notice.pdf',
      s3Location: { detectedContentType: 'application/pdf' }
    })

    expectUploadError(result, DOCUMENT_FILE_TYPE_ERROR_MESSAGE)
  })

  test('clears the session and returns to the marine plan policies page when the API has nothing to save against', async () => {
    vi.mocked(authRequests.authenticatedPostRequest).mockRejectedValue({
      output: { statusCode: statusCodes.notFound }
    })

    const { request, h } = await runWait({
      status: 'ready',
      s3Location: { detectedContentType: 'application/pdf' }
    })

    expect(request.yar.set).toHaveBeenCalledWith(
      DOCUMENT_UPLOAD_SESSION_KEY,
      {}
    )
    expect(h.redirect).toHaveBeenCalledWith(policiesUrl)
  })

  test.each([
    ['FILE_TOO_LARGE', DOCUMENT_FILE_SIZE_ERROR_MESSAGE],
    ['INVALID_FILE_TYPE', DOCUMENT_FILE_TYPE_ERROR_MESSAGE],
    ['VIRUS_DETECTED', 'The selected file contains a virus'],
    [undefined, DEFAULT_ERROR_MESSAGE]
  ])('maps the %s rejection to its message', async (errorCode, message) => {
    const result = await runWait({ status: 'rejected', errorCode })
    expectUploadError(result, message)
  })

  test('returns to the upload page when the upload status is unknown', async () => {
    const { request, h } = await runWait({ status: 'mystery' })

    expect(request.logger.warn).toHaveBeenCalled()
    expect(request.yar.set).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(uploadPageUrl)
  })

  test('clears the session and returns to the upload page when the status check fails', async () => {
    getStatus.mockRejectedValue(new Error('CDP down'))

    const request = createMockRequest({
      yar: { get: vi.fn(() => session), set: vi.fn(), commit: vi.fn() }
    })
    const h = createMockH()

    await marinePlanPolicySupportingDocumentUploadAndWaitController.handler(
      request,
      h
    )

    expect(request.yar.set).toHaveBeenCalledWith(
      DOCUMENT_UPLOAD_SESSION_KEY,
      {}
    )
    expect(h.redirect).toHaveBeenCalledWith(uploadPageUrl)
  })

  test('returns to the upload page when the API does not return a documentId', async () => {
    vi.mocked(authRequests.authenticatedPostRequest).mockResolvedValue({
      payload: { value: {} }
    })

    const { request, h } = await runWait({
      status: 'ready',
      s3Location: { detectedContentType: 'application/pdf' }
    })

    expect(request.logger.error).toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(uploadPageUrl)
  })

  test('clears the session and returns to the upload page when saving the document fails', async () => {
    vi.mocked(authRequests.authenticatedPostRequest).mockRejectedValue(
      new Error('API down')
    )

    const { request, h } = await runWait({
      status: 'ready',
      s3Location: { detectedContentType: 'application/pdf' }
    })

    expect(request.yar.set).toHaveBeenCalledWith(
      DOCUMENT_UPLOAD_SESSION_KEY,
      {}
    )
    expect(h.redirect).toHaveBeenCalledWith(uploadPageUrl)
  })
})

describe('#marinePlanPolicySupportingDocumentController', () => {
  let initiate

  beforeEach(() => {
    initiate = vi.fn().mockResolvedValue({
      uploadId: 'upload-id',
      statusUrl: 'status-url',
      uploadUrl: 'https://cdp/upload'
    })
    vi.mocked(getCdpUploadService).mockReturnValue({ initiate })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(marineLicence)
  })

  test('initiates an upload and renders the upload page', async () => {
    const request = createMockRequest()
    const h = createMockH()

    await marinePlanPolicySupportingDocumentController.handler(request, h)

    expect(initiate).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUrl:
          marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_UPLOAD_AND_WAIT
      })
    )
    expect(request.yar.set).toHaveBeenCalledWith(DOCUMENT_UPLOAD_SESSION_KEY, {
      uploadId: 'upload-id',
      statusUrl: 'status-url',
      uploadPageUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT
    })
    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE,
      expect.objectContaining({
        heading: 'Upload a supporting document',
        projectName: 'Test Project',
        uploadUrl: 'https://cdp/upload',
        backLink: policiesUrl,
        cancelLink: policiesUrl
      })
    )
  })

  test('shows an upload error saved in the session', async () => {
    const request = createMockRequest({
      yar: {
        get: vi.fn(() => ({
          uploadError: {
            message: DOCUMENT_FILE_TYPE_ERROR_MESSAGE,
            fieldName: 'file'
          }
        })),
        set: vi.fn(),
        commit: vi.fn()
      }
    })
    const h = createMockH()

    await marinePlanPolicySupportingDocumentController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE,
      expect.objectContaining({
        errorSummary: [
          expect.objectContaining({ text: DOCUMENT_FILE_TYPE_ERROR_MESSAGE })
        ],
        errors: {
          file: expect.objectContaining({
            text: DOCUMENT_FILE_TYPE_ERROR_MESSAGE
          })
        }
      })
    )
  })

  test('redirects to the marine plan policies page when the upload cannot be initiated', async () => {
    initiate.mockRejectedValue(new Error('CDP down'))
    const request = createMockRequest()
    const h = createMockH()

    await marinePlanPolicySupportingDocumentController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(policiesUrl)
  })
})
