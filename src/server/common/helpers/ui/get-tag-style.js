import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

export const getTagStyle = (status) => {
  switch (status) {
    case PROJECT_STATUS.DRAFT:
      return 'govuk-tag--blue'
    case PROJECT_STATUS.WITHDRAWN:
      return 'govuk-tag--grey'
    case PROJECT_STATUS.TRANSFERRED:
      return 'govuk-tag--magenta'
    case PROJECT_STATUS.REJECTED:
      return 'govuk-tag--orange'
    default:
      return 'govuk-tag--green'
  }
}
