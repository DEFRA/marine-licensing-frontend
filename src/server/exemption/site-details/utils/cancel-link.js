import { routes } from '#src/server/common/constants/routes.js'

export const getCancelLink = (action) =>
  action ? undefined : routes.TASK_LIST + '?cancel=site-details'
