import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getWaterFrameworkDirectiveChangeLink = (
  waterFrameworkDirective
) => {
  if (!waterFrameworkDirective) {
    return undefined
  }

  if (waterFrameworkDirective.nauticalMile === 'no') {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
  }

  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
}

export const getPublicRegisterChangeLink = (publicRegister) => {
  const path =
    publicRegister?.withholdConsent === 'yes'
      ? marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS
      : marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
  return `${path}?from=check-your-answers`
}
