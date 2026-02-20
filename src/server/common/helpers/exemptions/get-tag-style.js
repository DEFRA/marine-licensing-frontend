import { EXEMPTION_STATUS } from '#src/server/common/constants/exemptions.js'

export const getTagStyle = (status) => {
  switch (status) {
    case EXEMPTION_STATUS.DRAFT:
      return 'govuk-tag--light-blue'
    case EXEMPTION_STATUS.WITHDRAWN:
      return 'govuk-tag--grey'
    default:
      return 'govuk-tag--green'
  }
}
