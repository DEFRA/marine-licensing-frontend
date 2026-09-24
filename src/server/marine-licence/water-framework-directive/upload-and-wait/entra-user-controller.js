import { WFD_ALLOWED_MIME_TYPES } from '#src/server/common/constants/water-framework-directive.js'
import { WFD_FILE_TYPE_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  REPLACE_DOCUMENT_TYPES,
  createReplaceWaitController
} from '#src/server/marine-licence/view-marine-licence-internal-user/replace-document/index.js'

export const waterFrameworkDirectiveUploadAndWaitEntraUserController =
  createReplaceWaitController({
    documentType: REPLACE_DOCUMENT_TYPES.WATER_FRAMEWORK_DIRECTIVE,
    allowedMimeTypes: WFD_ALLOWED_MIME_TYPES,
    fileTypeErrorMessage: WFD_FILE_TYPE_ERROR_MESSAGE,
    fieldKey: 'waterFrameworkDirective.withholdDocument'
  })
