import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { toApplicationReferenceUrlSegment } from '#src/server/common/helpers/marine-licence/application-reference-url-segment.js'

export const REPLACE_DOCUMENT_TYPES = {
  CONSTRUCTION_DRAWING: 'construction-drawing',
  WATER_FRAMEWORK_DIRECTIVE: 'water-framework-directive'
}

const ROUTES = {
  [REPLACE_DOCUMENT_TYPES.CONSTRUCTION_DRAWING]: {
    upload:
      marineLicenceRoutes.MARINE_LICENCE_REDACTION_UPLOAD_CONSTRUCTION_DRAWING,
    wait: marineLicenceRoutes.MARINE_LICENCE_REDACTION_UPLOAD_CONSTRUCTION_DRAWING_WAIT
  },
  [REPLACE_DOCUMENT_TYPES.WATER_FRAMEWORK_DIRECTIVE]: {
    upload: marineLicenceRoutes.MARINE_LICENCE_REDACTION_WFD_FILE_UPLOAD,
    wait: marineLicenceRoutes.MARINE_LICENCE_REDACTION_WFD_UPLOAD_AND_WAIT
  }
}

const withReference = (routePath, applicationReference) =>
  routePath.replace(
    '{applicationReference}',
    toApplicationReferenceUrlSegment(applicationReference)
  )

export const getReplaceDocumentUrl = (applicationReference) =>
  withReference(
    marineLicenceRoutes.MARINE_LICENCE_REDACTION_REPLACE_DOCUMENT,
    applicationReference
  )

export const replaceDocumentUrls = (
  applicationReference,
  documentType,
  { site, drawing } = {}
) => {
  const isConstructionDrawing =
    documentType === REPLACE_DOCUMENT_TYPES.CONSTRUCTION_DRAWING

  const query = isConstructionDrawing ? `?site=${site}&drawing=${drawing}` : ''
  const anchor = isConstructionDrawing
    ? `#construction-drawing-site-${site}-${drawing}`
    : '#water-framework-directive-card'

  const viewUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${toApplicationReferenceUrlSegment(applicationReference)}`
  const { upload, wait } = ROUTES[documentType]

  return {
    uploadUrl: `${withReference(upload, applicationReference)}${query}`,
    waitUrl: `${withReference(wait, applicationReference)}${query}`,
    returnUrl: `${viewUrl}${anchor}`
  }
}
