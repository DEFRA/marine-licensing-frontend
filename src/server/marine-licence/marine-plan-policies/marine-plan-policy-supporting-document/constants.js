export const DOCUMENT_UPLOAD_SESSION_KEY =
  'marinePlanPolicySupportingDocumentUpload'

export const DOCUMENT_ACCEPT_ATTRIBUTE = '.pdf,.doc,.docx,.odt'

export const DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/x-cfb',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text'
]

export const DOCUMENT_MAX_FILE_SIZE = 10 * 1024 * 1024

export const DOCUMENT_FILE_TYPE_ERROR_MESSAGE =
  'The selected file must be a PDF or document (.doc, .docx, .odt) file'

export const DOCUMENT_FILE_SIZE_ERROR_MESSAGE =
  'The selected file must be smaller than 10 MB'
