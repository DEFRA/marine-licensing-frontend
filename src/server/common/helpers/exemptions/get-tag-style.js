import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

export const getTagStyle = (status) => {
  switch (status) {
    case PROJECT_STATUS.DRAFT:
      return 'govuk-tag--light-blue'
    case PROJECT_STATUS.WITHDRAWN:
      return 'govuk-tag--grey'
    default:
      return 'govuk-tag--green'
  }
}
