import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getBackLink = (returnTo) =>
  returnTo
    ? `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
    : marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START

export const getCancelLink = (returnTo) =>
  returnTo
    ? `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
