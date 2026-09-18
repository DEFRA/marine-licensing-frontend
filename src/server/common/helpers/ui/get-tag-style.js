import {
  DISPLAY_STATUS,
  PROJECT_STATUS
} from '#src/server/common/constants/projects.js'

export const getTagStyle = (status) => {
  switch (status) {
    case PROJECT_STATUS.DRAFT:
      return 'govuk-tag--blue'
    case PROJECT_STATUS.SCHEDULED:
      return 'govuk-tag--green'
    case PROJECT_STATUS.ACTIVE:
      return 'govuk-tag--teal'
    case PROJECT_STATUS.EXPIRED:
      return 'govuk-tag--grey'
    case PROJECT_STATUS.WITHDRAWN:
      return 'govuk-tag--grey'
    case PROJECT_STATUS.TRANSFERRED:
      return 'govuk-tag--magenta'
    case PROJECT_STATUS.REJECTED:
      return 'govuk-tag--orange'
    case DISPLAY_STATUS.ACTION_REQUIRED:
      return 'govuk-tag--red'
    default:
      return 'govuk-tag--green'
  }
}
