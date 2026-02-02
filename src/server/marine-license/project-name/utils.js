import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

export const getBackLink = (isUpdate) =>
  isUpdate ? marineLicenseRoutes.MARINE_LICENSE_TASK_LIST : null
