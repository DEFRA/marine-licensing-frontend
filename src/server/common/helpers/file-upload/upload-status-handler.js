import { validateUploadedFile } from '#src/server/common/helpers/file-upload/geo-parse-upload.js'

const handleValidationError = async (
  request,
  h,
  validation,
  fileType,
  storeUploadError
) => {
  await storeUploadError(
    request,
    h,
    { message: validation.errorMessage, fieldName: 'file' },
    fileType
  )
}

export const handleReadyStatus = async (
  status,
  uploadConfig,
  request,
  h,
  { storeUploadError, fileUploadRoute }
) => {
  const validationResult = await validateUploadedFile(
    status,
    uploadConfig,
    request
  )

  if (!validationResult.isValid) {
    await handleValidationError(
      request,
      h,
      validationResult,
      uploadConfig.fileType,
      storeUploadError
    )
    return h.redirect(fileUploadRoute)
  }

  return null
}
