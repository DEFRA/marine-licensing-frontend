import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getBackLink = (returnTo) => {
  if (returnTo) {
    return returnTo
  }
  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
}

export const getCancelLink = (returnTo) =>
  returnTo ? undefined : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const getSubmitRedirect = (
  excludedActivities,
  returnTo,
  previousExcludedActivities
) => {
  const hasAnswerChanged = previousExcludedActivities !== excludedActivities

  if (returnTo && !hasAnswerChanged) {
    return returnTo
  }

  if (excludedActivities === 'no') {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
  }

  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
}
