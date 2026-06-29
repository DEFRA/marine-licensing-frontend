import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getBackLink = (
  returnTo,
  action,
  waterFrameworkDirectiveEntryPoint
) => {
  if (action) {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
  }
  if (returnTo) {
    return `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
  }
  if (waterFrameworkDirectiveEntryPoint === 'task-list') {
    return marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
  }
  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START
}

export const getCancelLink = (returnTo, action) => {
  if (action) {
    return undefined
  }
  if (returnTo) {
    return `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
  }
  return marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}
