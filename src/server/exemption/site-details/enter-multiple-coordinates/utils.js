export {
  PATTERNS,
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  COORDINATE_FIELDS,
  isWGS84,
  normaliseCoordinatesForDisplay,
  extractCoordinateIndexFromFieldName,
  sanitiseFieldName,
  sanitiseFieldId,
  convertPayloadToCoordinatesArray,
  convertArrayErrorsToFlattenedErrors,
  processErrorDetail,
  createErrorSummary,
  createFieldErrors,
  handleValidationFailure,
  removeCoordinateAtIndex
} from '#src/server/common/helpers/site-details/enter-multiple-coordinates.js'

import { routes } from '#src/server/common/constants/routes.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'

export const multipleCoordinatesPageData = {
  heading:
    'Enter multiple sets of coordinates to mark the boundary of the site',
  pageTitle:
    'Enter multiple sets of coordinates to mark the boundary of the site',
  backLink: routes.COORDINATE_SYSTEM_CHOICE,
  cancelLink: getCancelLink()
}
