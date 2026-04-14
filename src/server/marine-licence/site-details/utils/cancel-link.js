import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getCancelLink = (action) =>
  action ? undefined : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
