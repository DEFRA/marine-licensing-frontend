import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { config } from '#src/config/config.js'
import { createFileUploadErrorDisplay } from '#src/server/common/helpers/file-upload/file-upload.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import {
  getRedactionUpload,
  setRedactionUpload
} from '#src/server/common/helpers/marine-licence/session-cache/redaction-upload.js'
import {
  CONSTRUCTION_DRAWING_ACCEPT_ATTRIBUTE,
  CONSTRUCTION_DRAWING_S3_PATH
} from '#src/server/common/constants/construction-drawing.js'
import {
  CONSTRUCTION_DRAWING_MAX_FILE_SIZE,
  UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/upload-construction-drawing/controller.js'
import {
  replaceDocumentUrls,
  REPLACE_DOCUMENT_TYPES
} from '#src/server/marine-licence/view-marine-licence-internal-user/replace-document/index.js'

/**
 * The internal user's version of the construction drawing upload page. Same
 * view and same file rules as the applicant page — it reads the licence from
 * the backend rather than the session, and returns to the redaction page.
 */
export const uploadConstructionDrawingEntraUserController = {
  async handler(request, h) {
    const { applicationReference } = request.params
    const { siteNumber, drawingNumber } = getSiteDataFromParam(request.query)

    const marineLicence =
      await getMarineLicenceService(request).getMarineLicenceByReference(
        applicationReference
      )

    const urls = replaceDocumentUrls(
      applicationReference,
      REPLACE_DOCUMENT_TYPES.CONSTRUCTION_DRAWING,
      request.query
    )

    const { uploadError } = getRedactionUpload(request)
    const { errorSummary, errors } = uploadError
      ? createFileUploadErrorDisplay(uploadError, request)
      : {}

    const uploadConfig = await getCdpUploadService().initiate({
      redirectUrl: urls.waitUrl,
      s3Path: CONSTRUCTION_DRAWING_S3_PATH,
      s3Bucket: config.get('cdpUploader').s3Bucket,
      maxFileSize: CONSTRUCTION_DRAWING_MAX_FILE_SIZE
    })

    await setRedactionUpload(request, h, {
      uploadId: uploadConfig.uploadId,
      statusUrl: uploadConfig.statusUrl
    })

    const heading = `Site ${siteNumber}: Upload construction drawing ${drawingNumber}`

    return h.view(UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE, {
      pageTitle: heading,
      heading,
      projectName: marineLicence.projectName,
      siteNumber,
      drawingNumber,
      uploadUrl: uploadConfig.uploadUrl,
      acceptAttribute: CONSTRUCTION_DRAWING_ACCEPT_ATTRIBUTE,
      backLink: urls.returnUrl,
      cancelLink: urls.returnUrl,
      errorSummary,
      errors
    })
  }
}
