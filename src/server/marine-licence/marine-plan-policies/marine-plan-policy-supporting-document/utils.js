import { config } from '#src/config/config.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { createFileUploadErrorDisplay } from '#src/server/common/helpers/file-upload/file-upload.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_FILE_SIZE,
  DOCUMENT_UPLOAD_SESSION_KEY
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/constants.js'

const DOCUMENT_S3_PATH = 'marine-licence/marine-plan-policy'

export const getMarinePlanPolicySupportingDocumentUploadSession = (request) =>
  request.yar.get(DOCUMENT_UPLOAD_SESSION_KEY) ?? {}

export const setMarinePlanPolicySupportingDocumentUploadSession = async (
  request,
  h,
  value
) => {
  request.yar.set(DOCUMENT_UPLOAD_SESSION_KEY, value)
  await request.yar.commit(h)
}

export const getMarinePlanPolicySupportingDocumentUploadErrorDisplay = (
  request
) => {
  const { uploadError } =
    getMarinePlanPolicySupportingDocumentUploadSession(request)
  return uploadError ? createFileUploadErrorDisplay(uploadError, request) : {}
}

export const getMarinePlanPolicyDocumentTypeUrl = (documentId) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE.replace(
    '{documentId}',
    encodeURIComponent(documentId)
  )

export const getMarinePlanPolicyDocumentPolicyUrl = (documentId) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY.replace(
    '{documentId}',
    encodeURIComponent(documentId)
  )

export const buildSupportingDocument = (status) => ({
  uploadedFile: { filename: status.filename },
  s3Location: {
    s3Bucket: config.get('cdpUploader').s3Bucket,
    s3Key: status.s3Location?.s3Key,
    checksumSha256: status.s3Location?.checksumSha256
  }
})

export const persistSupportingDocument = async (
  request,
  marineLicenceId,
  status
) => {
  const response = await authenticatedPostRequest(
    request,
    apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT,
    {
      id: marineLicenceId,
      ...buildSupportingDocument(status)
    }
  )

  const documentId = response.payload?.value?.documentId
  if (!documentId) {
    throw new Error('Supporting document saved without a documentId')
  }
  return documentId
}

export const initiateMarinePlanPolicySupportingDocumentUpload = async (
  request,
  h
) => {
  const uploadConfig = await getCdpUploadService().initiate({
    redirectUrl:
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_UPLOAD_AND_WAIT,
    s3Path: DOCUMENT_S3_PATH,
    s3Bucket: config.get('cdpUploader').s3Bucket,
    allowedMimeTypes: DOCUMENT_ALLOWED_MIME_TYPES,
    maxFileSize: DOCUMENT_MAX_FILE_SIZE
  })

  await setMarinePlanPolicySupportingDocumentUploadSession(request, h, {
    uploadId: uploadConfig.uploadId,
    statusUrl: uploadConfig.statusUrl,
    uploadPageUrl:
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT
  })

  return uploadConfig
}
