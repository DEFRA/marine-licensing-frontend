import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getChangeLink = (waterFrameworkDirective) => {
  if (!waterFrameworkDirective) {
    return undefined
  }

  if (waterFrameworkDirective.nauticalMile === 'no') {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
  }

  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
}
