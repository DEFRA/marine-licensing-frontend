import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import { MARINE_LICENCE_TYPE } from '#src/server/common/constants/marine-licence.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'

/**
 * @param {string} applicationType
 * @returns {string}
 */
export const getApplicationTypeLabel = (applicationType) => {
  switch (applicationType) {
    case PROJECT_TYPE.MARINE_LICENCE:
      return MARINE_LICENCE_TYPE
    case PROJECT_TYPE.EXEMPTION:
      return EXEMPTION_TYPE
    default:
      return applicationType || '-'
  }
}
