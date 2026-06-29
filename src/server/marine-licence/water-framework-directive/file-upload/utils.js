import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getBackLink = (fileUploadEntryPoint) => {
  if (fileUploadEntryPoint === 'review-your-answers') {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
  }

  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
}

export const getCancelLink = (returnTo) =>
  returnTo ===
  marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    ? undefined
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
