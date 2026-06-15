import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export function getBackLink(previousAssessment) {
  if (previousAssessment === 'no') {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
  }

  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
}
