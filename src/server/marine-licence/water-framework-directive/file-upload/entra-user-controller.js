import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { config } from '#src/config/config.js'
import { createFileUploadErrorDisplay } from '#src/server/common/helpers/file-upload/file-upload.js'
import {
  getRedactionUpload,
  setRedactionUpload
} from '#src/server/common/helpers/marine-licence/session-cache/redaction-upload.js'
import {
  s3PathForWaterFrameworkDirective,
  WFD_ACCEPT_ATTRIBUTE
} from '#src/server/common/constants/water-framework-directive.js'
import {
  WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE,
  WFD_FILE_UPLOAD_PAGE_HEADING
} from '#src/server/marine-licence/water-framework-directive/file-upload/controller.js'
import {
  replaceDocumentUrls,
  REPLACE_DOCUMENT_TYPES
} from '#src/server/marine-licence/view-marine-licence-internal-user/replace-document/index.js'

export const waterFrameworkFileUploadEntraUserController = {
  async handler(request, h) {
    const { applicationReference } = request.params

    const marineLicence =
      await getMarineLicenceService(request).getMarineLicenceByReference(
        applicationReference
      )

    const urls = replaceDocumentUrls(
      applicationReference,
      REPLACE_DOCUMENT_TYPES.WATER_FRAMEWORK_DIRECTIVE,
      request.query
    )

    const { uploadError } = getRedactionUpload(request)
    const { errorSummary, errors } = uploadError
      ? createFileUploadErrorDisplay(uploadError, request)
      : {}

    const uploadConfig = await getCdpUploadService().initiate({
      redirectUrl: urls.waitUrl,
      s3Path: s3PathForWaterFrameworkDirective,
      s3Bucket: config.get('cdpUploader').s3Bucket
    })

    await setRedactionUpload(request, h, {
      uploadId: uploadConfig.uploadId,
      statusUrl: uploadConfig.statusUrl
    })

    return h.view(WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE, {
      pageTitle: WFD_FILE_UPLOAD_PAGE_HEADING,
      heading: WFD_FILE_UPLOAD_PAGE_HEADING,
      projectName: marineLicence.projectName,
      uploadUrl: uploadConfig.uploadUrl,
      maxFileSize: uploadConfig.maxFileSize,
      acceptAttribute: WFD_ACCEPT_ATTRIBUTE,
      backLink: urls.returnUrl,
      cancelLink: urls.returnUrl,
      errorSummary,
      errors
    })
  }
}
