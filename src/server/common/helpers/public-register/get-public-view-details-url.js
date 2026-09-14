import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'

/**
 * @param {string} applicationType
 * @param {string} applicationId
 * @returns {string}
 */
export const getPublicViewDetailsUrl = (applicationType, applicationId) => {
  switch (applicationType) {
    case PROJECT_TYPE.MARINE_LICENCE:
      return `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC}/${applicationId}`
    case PROJECT_TYPE.EXEMPTION:
    default:
      return `${routes.VIEW_DETAILS_PUBLIC}/${applicationId}`
  }
}
