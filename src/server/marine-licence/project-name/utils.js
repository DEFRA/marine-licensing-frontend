import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getBackLink = (isUpdate) =>
  isUpdate ? marineLicenceRoutes.MARINE_LICENCE_TASK_LIST : null
