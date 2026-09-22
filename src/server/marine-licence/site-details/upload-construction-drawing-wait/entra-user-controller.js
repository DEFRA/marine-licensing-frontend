import { CONSTRUCTION_DRAWING_ALLOWED_MIME_TYPES } from '#src/server/common/constants/construction-drawing.js'
import { FILE_TYPE_ERROR_MESSAGES } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  REPLACE_DOCUMENT_TYPES,
  createReplaceWaitController
} from '#src/server/marine-licence/view-marine-licence-internal-user/replace-document/index.js'

export const uploadConstructionDrawingWaitEntraUserController =
  createReplaceWaitController({
    documentType: REPLACE_DOCUMENT_TYPES.CONSTRUCTION_DRAWING,
    fileType: REPLACE_DOCUMENT_TYPES.CONSTRUCTION_DRAWING,
    allowedMimeTypes: CONSTRUCTION_DRAWING_ALLOWED_MIME_TYPES,
    fileTypeErrorMessage:
      FILE_TYPE_ERROR_MESSAGES[REPLACE_DOCUMENT_TYPES.CONSTRUCTION_DRAWING],
    fieldKey: 'siteDetails.constructionDrawings.withholdDocument'
  })
