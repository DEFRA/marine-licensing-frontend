import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export function getBackLink(excludedActivities) {
  if (excludedActivities === 'yes') {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
  }

  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
}
